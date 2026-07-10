package com.example.ReservationEvent.messaging;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AMQP topology for reservation domain events. Publishes to a durable
 * topic exchange (default {@code reservation.events}) with routing keys
 * like {@code reservation.created}. Any consumer (the Node.js
 * notification-service in this project) can bind and react.
 */
@Configuration
public class RabbitConfig {

    private static final Logger log = LoggerFactory.getLogger(RabbitConfig.class);

    @Value("${app.rabbitmq.exchange:reservation.events}")
    private String exchangeName;

    @Value("${spring.rabbitmq.host:UNSET}")
    private String rabbitHost;

    @Value("${spring.rabbitmq.port:5672}")
    private int rabbitPort;

    @PostConstruct
    public void logConfig() {
        log.info("[rabbit] configured: host={} port={} exchange={}",
                rabbitHost, rabbitPort, exchangeName);
    }

    @Bean
    public TopicExchange reservationEventsExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin admin = new RabbitAdmin(connectionFactory);
        admin.setIgnoreDeclarationExceptions(true);
        return admin;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         MessageConverter messageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);
        template.setExchange(exchangeName);
        return template;
    }
}
