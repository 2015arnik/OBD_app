package com.obd.config;

import com.obd.security.CurrentUserArgumentResolver;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final CurrentUserArgumentResolver currentUserArgumentResolver;
    private final String[] allowedOriginPatterns;

    public WebConfig(CurrentUserArgumentResolver currentUserArgumentResolver,
                     @Value("${app.cors.allowed-origin-patterns:*}") String[] allowedOriginPatterns) {
        this.currentUserArgumentResolver = currentUserArgumentResolver;
        this.allowedOriginPatterns = allowedOriginPatterns;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserArgumentResolver);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(allowedOriginPatterns)
                .allowedMethods("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
