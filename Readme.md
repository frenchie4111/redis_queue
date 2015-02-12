# Redis Queue

A simple nodejs message queue that utilzies Redis.

## Ussage

Creating a queue

```javascript
var RedisQueue = require( 'redis_queue' ).RedisQueue;

var queue = new RedisQueue();

queue.push( { message: 'This is a message' } );
```

```javascript
var RedisQueue = require( 'redis_queue' ).RedisQueue;

var queue = new RedisQueue();

queue.monitor.on( 'message', function( queue_name, message ) {
    console.log( message );
} );
```

## Considerations

You can not use the same queue instance for monitoring and pushing,
as the brpop operation blocks the redis from calling lpush.

## Constructor options

You can specify options to the constructor, below are the objects and the default values.

```javascript
var RedisQueue = require( 'redis_queue' ).RedisQueue;

var queue = new RedisQueue( {
    redis_client: redis.createClient(),
    queue_name: 'redis_queue',
    object_mode: true
} );
```

Descriptions:

- **redis_client**: The redis_client to specify the client to use to connect to redis
- **queue_name**: The redis key name of the queue
- **object_mode**: Whether or not to put the queue in object mode. In object mode objects can be pushed / popped, otherwise strings are pushed / popped