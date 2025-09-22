package ch4.dashpage.service;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.ArrayList;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.core.annotation.Order;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.logging.Logger;

@Service
@Order(1) // 确保在应用启动时优先执行
public class bilibiliService implements CommandLineRunner {
    
    private static final Logger logger = Logger.getLogger(bilibiliService.class.getName());
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String cacheFilePath = "src/main/java/ch4/dashpage/service/cache/bili.json";
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("应用启动时开始爬取Bilibili热门数据...");
        crawlBilibili();
        logger.info("Bilibili热门数据爬取完成");
    }
    
    public void crawlBilibili() throws Exception {
        try {
            String url = "https://api.bilibili.com/x/web-interface/wbi/search/square?limit=10";

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            String json = response.body();
            
            JsonNode rootNode = objectMapper.readTree(json);
            JsonNode listNode = rootNode.path("data").path("trending").path("list");
            ArrayNode biliList = objectMapper.createArrayNode();
            
            for (JsonNode itemNode : listNode) {
                ObjectNode biliItem = objectMapper.createObjectNode();
                String keyword = itemNode.path("keyword").asText();
                String showName = itemNode.path("show_name").asText();
                String link = "https://search.bilibili.com/all?keyword=" + keyword;
                
                biliItem.put("show_name", showName);
                biliItem.put("keyword", keyword);
                biliItem.put("link", link);
                biliItem.put("type", "bilibili");
                biliList.add(biliItem);
            }
            
            // 保存到缓存文件
            File cacheFile = new File(cacheFilePath);
            cacheFile.getParentFile().mkdirs(); // 确保目录存在
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(cacheFile, biliList);
            
            logger.info("成功爬取并缓存了 " + biliList.size() + " 条Bilibili热门数据");
            
        } catch (Exception e) {
            logger.severe("爬取Bilibili数据失败: " + e.getMessage());
            throw e;
        }
    }
    
    public List<BiliItem> getCachedData() throws Exception {
        File cacheFile = new File(cacheFilePath);
        if (!cacheFile.exists()) {
            logger.warning("缓存文件不存在，尝试重新爬取数据");
            crawlBilibili();
        }
        
        List<BiliItem> items = objectMapper.readValue(cacheFile, new TypeReference<List<BiliItem>>() {});
        return items;
    }
    
    // 内部类，用于数据传输
    public static class BiliItem {
        private String show_name;
        private String keyword;
        private String link;
        private String type;
        
        // Getters and Setters
        public String getShow_name() { return show_name; }
        public void setShow_name(String show_name) { this.show_name = show_name; }
        
        public String getKeyword() { return keyword; }
        public void setKeyword(String keyword) { this.keyword = keyword; }
        
        public String getLink() { return link; }
        public void setLink(String link) { this.link = link; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }
}
