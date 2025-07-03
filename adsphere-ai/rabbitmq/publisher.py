import time

import pika
import json
import logging

from pika.exceptions import AMQPConnectionError

from config.env import (
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USER,
    RABBITMQ_PASS,
    RABBITMQ_QUEUE,
)

class RabbitMqPublisher:
    def __init__(self, queue_name=RABBITMQ_QUEUE):
        self.queue_name = queue_name
        self._connect()

    def _connect(self):
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials
        )
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=self.queue_name, durable=True)

    def publish(self, ad_id: str, created_at):
        message = {
            "data": {
                "adId": ad_id,
                "date": created_at.isoformat()
            }
        }

        self.channel.basic_publish(
            exchange='',
            routing_key=self.queue_name,
            body=json.dumps(message),
            properties=pika.BasicProperties(delivery_mode=2)
        )

    def close(self):
        if self.connection and not self.connection.is_closed:
            self.connection.close()