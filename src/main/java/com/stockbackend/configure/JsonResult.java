package com.stockbackend.configure;

import lombok.Data;

@Data
public class JsonResult<T> {

    private T data;
    private String code;
    private String msg;

    public JsonResult() {
        this.code = "0";
        this.msg = "操作成功";
    }

    public JsonResult(T data) {
        this.code = "0";
        this.msg = "操作成功";
        this.data = data;
    }

    public JsonResult(String msg, T data) {
        this.code = "0";
        this.msg = msg;
        this.data = data;
    }

    public JsonResult(String code, String msg, T data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    public static JsonResult<?> success(){
        JsonResult<?> jsonResult = new JsonResult<>();
        jsonResult.setCode("0");
        jsonResult.setMsg("成功");
        return jsonResult;
    }

    public static <T> JsonResult<T> success(T data){
        JsonResult<T> jsonResult = new JsonResult<>(data);
        jsonResult.setCode("0");
        jsonResult.setMsg("成功");
        return jsonResult;
    }

    public static JsonResult<?> success(String code, String msg){
        JsonResult<?> jsonResult = new JsonResult<>();
        jsonResult.setCode(code);
        jsonResult.setMsg(msg);
        return jsonResult;
    }

    public static JsonResult<?> error(String code, String msg){
        JsonResult<?> jsonResult = new JsonResult<>();
        jsonResult.setCode(code);
        jsonResult.setMsg(msg);
        return jsonResult;
    }

}
