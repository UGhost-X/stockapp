package com.stockbackend.utils;

import com.sun.istack.internal.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import com.google.gson.Gson;

/**
 * <p>Title: 常用的工具类 - ToolsUtil</p>
 *
 * <p>Description:常用工具放这儿</p>
 *
 * <p>Copyright: Copyright Faker(c) 2018</p>
 *
 * <p>Company: 无</p>
 *
 * @author Anlinxi
 *
 * @version 1.0
 */
public class ToolsUtil {

    /**
     * 工具类实例化对象
     */
    private static ToolsUtil toolsUtil = null;

    /**
     * 私有化构造函数防止new对象消耗内存
     */
    private ToolsUtil() {

    }
    /**
     * 静态实例化方法获取实例化对象
     * 使用同一个lCsinginUtil，减少内存占用
     * @return LCsinginUtil
     */
    public static ToolsUtil getInstence(){
        if(toolsUtil==null){
            toolsUtil = new ToolsUtil();
        }
        return toolsUtil;
    }

    /**
     * 日志
     */
    private final static Logger logger = LoggerFactory.getLogger(ToolsUtil.class);

    /**
     * 发送json数据
     * @param response 响应
     * @param object 发送的对象
     */
    public static void WriterJson(@NotNull HttpServletResponse response, Object object){
        try {
            Gson gson = new Gson();
            String backJson;

            if (object instanceof List) {
                backJson = gson.toJson(object);
            } else {
                backJson = gson.toJson(object);
            }
            response.setHeader("Cache-Control", "no-cache");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setContentType("text/json;charset=utf-8");
            PrintWriter printWriter = response.getWriter();
            logger.info("发送json数据>>>>>>>>>>>>>>>>"+backJson);
            printWriter.write(backJson);
            printWriter.flush();
            printWriter.close();
        } catch (IOException e) {
            logger.error("发送json数据失败");
            e.printStackTrace();
        }
    }


    /**
     * 判断一个字符串是否为null或空字符，是则返回false，否为true
     * @param str 字符串对象
     * @return 是否为null或空字符
     */
    public static boolean isNotNull(Object str){
        return !isNullOrEmpty(str);
    }

    /**
     * 判断一个字符串是否为null或空字符，是则返回true，否为false
     * @param str 字符串对象
     * @return 是否为null或空字符
     */
    public static boolean isNullOrEmpty(Object str){
        String t = trim(str);
        if(t.equals("") || t==null){
            return true;
        } else {
            return false;
        }
    }

    /**
     * 字符串对象去空
     * @param str 字符串对象
     * @return 替换空
     */
    public static String trim(Object str){
        return trim(str, "");
    }

    /**
     * 将对象转换为字符串类型
     * @param obj 对象
     * @param nullToString 如果为空就返回该默认值
     * @return 字符串类型
     */
    public static String trim(Object obj, String nullToString){
        return obj == null ? nullToString : obj.toString().trim();
    }

    /**
     * 读取python文件代码
     * @param fileName 文件名(含后缀)
     * @param path 文件夹路径
     * @return 读取的字符串
     */
    public Boolean download( HttpServletResponse response,String fileName, String path){
        FileInputStream inStream  = null;
        try {
            inStream = new FileInputStream(path+fileName);
            //通过available方法取得流的最大字符数
            byte[] inOutb = new byte[inStream.available()];
            //读入流,保存在byte数组
            inStream.read(inOutb);
            //设置文件类型
            response.setContentType(Files.probeContentType(Paths.get(path+fileName)));
            //将response提取流
            OutputStream out = response.getOutputStream();
            //将byte数组写入response中
            out.write(inOutb);
            //刷新流
            out.flush();
            out.close();
            inStream.close();
        } catch (Exception e) {
            // TODO 自动生成的 catch 块
            e.printStackTrace();
            return false;
        }
        return true;
    }

    /**
     * 获取系统信息
     */
    Properties prop = System.getProperties();

    /**
     * 获取当前服务器所在系统的路径
     * @return 服务器的路径
     */
    public String classRootPath() {
        //确定jython目录的路径
        String classRootPath = this.getClass().getResource("/").toString();
        String os = prop.getProperty("os.name");
        if (os != null && os.toLowerCase().indexOf("linux") > -1) {
            return classRootPath.replace("file:", "");
        } else {
            return classRootPath.replace("file:/", "");
        }
    }

    /**
     * 获取properties文件配置信息
     * @param fileName 文件名(不含后缀)
     * @param key 取值对应的键名
     * @return 值
     * @throws Exception 异常
     */
    public String getProperties (String fileName,String key) throws Exception {
        //文件名不为空
        if(fileName!=null&&!"".equals(fileName)){
            //不需要后缀
            if(fileName.contains(".properties")){
                fileName.replace(".properties","");
            }
            if(key!=null&&!"".equals(key)){
                //properties文件放置的位置
                String fileAddr = "config/"+fileName;
                ResourceBundle resource = ResourceBundle.getBundle(fileAddr);
                String text = new String(resource.getString(key).getBytes("ISO-8859-1"), "UTF8");
                return text;
            }else{
                throw new Exception("取值键名为空！");
            }
        }else{
            throw new Exception("文件名为空！");
        }
    }
}


