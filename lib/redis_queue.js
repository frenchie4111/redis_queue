/**
 * Authors:
 *     - Mike Lyons (m@mkone.co)
 */

(function() {
    'use strict';

    var util = require( 'util' ),
        _ = require( 'underscore' ),
        events = require( 'events' ),
        redis = require( 'redis' ),
        q = require( 'q' );

    /**
     * Error type used by this library
     * @param message The message that this error will have
     * @constructor
     */
    var RedisQueueError = function( message ) {
        this.message = message;
        Error.bind( this )( message );
    };
    util.inherits( RedisQueueError, Error );

    /**
     *
     * @param options Options to initiate the Queue with
     * @param options.redis_client (redis.createClient()) The redis client to use for this queue
     * @param options.queue_name ('redis_queue') The name of the key to use for the queue
     * @param options.object_mode (true) Whether or not the message payloads are json
     * @constructor
     */
    var RedisQueue = function RedisQueue( options ) {
        options = options || {};
        _.defaults( options, {
            redis_client: null,
            queue_name: 'redis_queue',
            object_mode: true
        } );
        if( !options.redis_client ) {
            options.redis_client = redis.createClient(); // Try to create a client if we didn't get one in options
        }

        /**
         * Pushes an item onto the queue
         * @param item Object/String The message to push onto the queue. If is_json is true, this should be an object that responds to JSON.stringify()
         */
        this.push = function( item ) {
            return q.Promise( function( resolve, reject ) {
                if( options.object_mode && !_.isObject( item ) ) return reject( new RedisQueueError( 'Pushed item that was not object, when object_mode was true' ) );
                if( !options.object_mode && _.isObject( item ) ) return reject( new RedisQueueError( 'Pushed item that was object, when object_mode was false' ) );

                return options.redis_client.lpush( options.queue_name, JSON.stringify( item ), function( err, res ) {
                    if( err ) return reject( err );
                    resolve( res );
                } );
            } );
        };

        /**
         * Begins monitoring the queue. The queue will now emit 'message' when there is a new item on the queue.
         * Returns this queue, so that you can chain queue.monitor().on( 'message', ... );
         * @returns {RedisQueue}
         */
        this.monitor = function() {
            var _this = this;

            options.redis_client.brpop( options.queue_name, 0, function( err, res ) {
                try {
                    if( err ) return _this.emit( 'error', err );
                    if( res.length !== 2 ) return _this.emit( 'error', new RedisQueueError( 'Bad number of replied from redis: ' + res.length ) );

                    return _this.emit( 'message', res[ 0 ], ( options.object_mode ) ? JSON.parse( res[ 1 ] ) : res[ 1 ] );
                } finally {
                    // Loop again!
                    _this.monitor();
                }
            } );

            return _this;
        };

        events.EventEmitter.apply( this );
    };
    util.inherits( RedisQueue, events.EventEmitter );

    exports.RedisQueue = RedisQueue;
})();