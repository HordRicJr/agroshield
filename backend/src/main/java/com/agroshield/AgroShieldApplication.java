package com.agroshield;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AgroShieldApplication {

    public static void main(String[] args) {
        SpringApplication.run(AgroShieldApplication.class, args);
    }
}
