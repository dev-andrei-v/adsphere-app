import pika
import json
import logging

from config.env import (
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USER,
    RABBITMQ_PASS,
    RABBITMQ_QUEUE,
)
from services.ad_review import automated_ad_review
logger = logging.getLogger(__name__)

AD_PROCESS = 'ad.process',

def _callback(ch, method, properties, body):
    try:
        received_payload = json.loads(body)
        logger.info(f"📨 Received from {RABBITMQ_QUEUE}: {received_payload}")
        data = received_payload.get("data", {})
        ad_id = data.get("adId")

        if ad_id:
            automated_ad_review(ad_id)
        else:
            logger.warning("⚠️ No adId found in the received message.")
    except Exception as e:
        logger.error(f"❌ Failed to process message: {e}")
    finally:
        ch.basic_ack(delivery_tag=method.delivery_tag)

def start_rabbitmq_consumer():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials
    )

    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()
    channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=RABBITMQ_QUEUE, on_message_callback=_callback)
    logger.info(f"🔗 Connected to RabbitMQ at {RABBITMQ_HOST}:{RABBITMQ_PORT} as {RABBITMQ_USER}")
    channel.start_consuming()

