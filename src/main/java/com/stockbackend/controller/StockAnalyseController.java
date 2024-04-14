package com.stockbackend.controller;

import com.stockbackend.configure.JsonResult;
import com.stockbackend.serivce.StockInfoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stock")
@Slf4j
public class StockAnalyseController {
    @Autowired
    StockInfoService stockInfoService;

    // 获取当日交易数据
    @PostMapping("/getDailyTradeData")
    public JsonResult<?> invokeGetDailyTradeData(){
        try{
            stockInfoService.getDailyTradeData();
        }catch (Exception e){
            e.printStackTrace();
        }
        return JsonResult.success();
    }
    // 获取所有历史数据
    @PostMapping("/getAllHisStockData")
    public JsonResult<?> invokeGetAllHisStockData(){
        try{
            stockInfoService.getAllHisStockData();
        }catch (Exception e){
            e.printStackTrace();
        }
        return JsonResult.success();
    }
    // 获取股票基础信息
    @PostMapping("/getBasicStockInfo")
    public JsonResult<?> invokeGetBasicStockInfo(){
        try{
            stockInfoService.getBasicStockInfo();
        }catch (Exception e){
            e.printStackTrace();
        }
        return JsonResult.success();
    }

}
