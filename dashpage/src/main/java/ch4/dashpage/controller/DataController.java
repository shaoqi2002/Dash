package ch4.dashpage.controller;

import ch4.dashpage.service.bilibiliService;
import ch4.dashpage.service.bilibiliService.BiliItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api")
public class DataController {

    @Autowired
    private bilibiliService bilibiliService;

    @GetMapping("/bilibili/trending")
    public ResponseEntity<?> getBilibiliTrending() {
        try {
            List<BiliItem> items = bilibiliService.getCachedData();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", items);
            response.put("count", items.size());
            response.put("message", "获取Bilibili热门数据成功");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取Bilibili数据失败", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取数据失败: " + e.getMessage());
            errorResponse.put("data", null);
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/bilibili/refresh")
    public ResponseEntity<?> refreshBilibiliData() {
        try {
            bilibiliService.crawlBilibili();
            List<BiliItem> items = bilibiliService.getCachedData();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", items);
            response.put("count", items.size());
            response.put("message", "刷新Bilibili数据成功");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("刷新Bilibili数据失败", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "刷新数据失败: " + e.getMessage());
            errorResponse.put("data", null);
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}