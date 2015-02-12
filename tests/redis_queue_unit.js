/**
 * Authors:
 *     - Mike Lyons (m@mkone.co)
 */

( function() {
    'use strict';

    var assert = require( 'chai' ).assert,
        redis_queue = require( '../index' ),
        redis = require( 'redis' ),
        _ = require( 'underscore' );

    describe( 'Redis Queue Tests', function() {

        // -------- Test Constrains

        var QUEUE_NAME = 'test_redis_queue';

        var _getNewRedisClient = function() {
            return redis.createClient();
        };

        var _createTestQueue = function( object_mode ) {
            object_mode = ( object_mode === undefined ) ? true : object_mode;

            return new redis_queue.RedisQueue( {
                queue_name: QUEUE_NAME,
                object_mode: object_mode,
                redis_client: redis.createClient()
            } );
        };

        // -------- Tests

        it( 'Should have push and monitor methods', function() {
            var queue = _createTestQueue();
            assert.includeMembers( _.functions( queue ), [ 'push', 'monitor' ], 'Should have push and monitor methods' );
        } );

        it( 'Should should push items onto the queue', function( done ) {
            var redis_client = _getNewRedisClient();
            var queue = _createTestQueue( true );

            var test_item = { test: 'test_item_value' };

            redis_client.brpop( QUEUE_NAME, 0, function( err, items ) {
                try {
                    assert.equal( items.length, 2, 'Redis response should be 2 values' );
                    assert.equal( items[ 0 ], QUEUE_NAME, 'First redis response item should be queue name' );
                    assert.equal( JSON.stringify( test_item ), items[ 1 ], 'Item popped off should match item pushed on' );

                    done();
                } catch( err ) {
                    done( err );
                }
            } );

            queue.push( test_item );
        } );

        it( 'Should emit message with item when being monitored', function( done ) {
            var redis_client = _getNewRedisClient();
            var queue = _createTestQueue( true );

            var test_item = { test: 'test_item_value' };

            queue.monitor().on( 'message', function( queue_name, item ) {
                try {
                    assert.equal( queue_name, QUEUE_NAME, 'First argument should be queue name' );
                    assert.deepEqual( item, test_item, 'Second argument should be the item we pushed onto the stack' );

                    done();
                } catch( err ) {
                    done( err );
                }
            } );

            redis_client.lpush( QUEUE_NAME, JSON.stringify( test_item ) );
        } );

        it( 'Should reject objects when object_mode is false', function( done ) {
            var queue = _createTestQueue( false );

            var test_item = { test: 'test_item' };

            queue
                .push( test_item )
                .then( function() {
                    done( 'Should have thrown error' );
                } )
                .catch( function( err ) {
                    try {
                        assert.match( err.message, /Pushed item that was object, when object_mode was false/, 'Should have thrown error with message' )

                        done();
                    } catch( err ) {
                        done( err );
                    }
                } )
        } );

        it( 'Should reject non-objects when object_mode is false', function( done ) {
            var queue = _createTestQueue( true );

            var test_item = 'not an object';

            queue
                .push( test_item )
                .then( function() {
                    done( 'Should have thrown error' );
                } )
                .catch( function( err ) {
                    try {
                        assert.match( err.message, /Pushed item that was not object, when object_mode was true/, 'Should have thrown error with message' )

                        done();
                    } catch( err ) {
                        done( err );
                    }
                } )
        } );

    } );
} )();