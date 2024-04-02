package com.stockbackend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/hello")
public class StockAnalyse {
    @RequestMapping("/")
    public String  test(){
        return "hello";
    }
}
