package com.auth.users.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async executor for {@code @Async} methods (mainly the RabbitMQ publisher).
 * <p>
 * The Spring default is a {@code SimpleAsyncTaskExecutor} which spawns a NEW
 * thread on every call and doesn't reuse anything — under load that means:
 * <ul>
 *   <li>Unbounded thread creation → possible {@code OutOfMemoryError}.</li>
 *   <li>If the async work blocks (e.g. Rabbit reconnecting), we can end up
 *       with a growing pile of stuck threads.</li>
 * </ul>
 * A small bounded pool with a caller-runs fallback is much safer.
 */
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(2);
        ex.setMaxPoolSize(8);
        ex.setQueueCapacity(100);
        ex.setThreadNamePrefix("users-async-");
        // If the queue is full, run the task on the caller's thread instead
        // of rejecting it — publish failures are recoverable, dropping events
        // is not.
        ex.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        // Give in-flight tasks up to 20s to finish on shutdown.
        ex.setWaitForTasksToCompleteOnShutdown(true);
        ex.setAwaitTerminationSeconds(20);
        ex.initialize();
        return ex;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (throwable, method, params) ->
                log.error("Uncaught exception in @Async method {}: {}",
                        method.getName(), throwable.getMessage(), throwable);
    }
}
