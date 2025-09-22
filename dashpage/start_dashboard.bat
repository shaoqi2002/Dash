@echo off
setlocal

:: 设置窗口标题和字符编码
title Dashboard 启动器
chcp 65001 >nul

echo.
echo ============================================
echo          Dashboard 仪表板启动器
echo ============================================
echo.

:: 检查Java环境
echo [1/5] 检查Java环境...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到Java环境！
    echo    请确保已安装Java 17或更高版本
    echo    下载地址：https://openjdk.org/
    pause
    exit /b 1
)
echo ✅ Java环境检查通过

:: 检查Maven环境
echo [2/5] 检查Maven环境...
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  警告：未检测到Maven环境，将使用内置的Maven Wrapper
    set USE_WRAPPER=true
) else (
    echo ✅ Maven环境检查通过
    set USE_WRAPPER=false
)

:: 编译项目
echo [3/5] 编译项目...
if "%USE_WRAPPER%"=="true" (
    call mvnw.cmd clean package -DskipTests -q
) else (
    call mvn clean package -DskipTests -q
)

if %errorlevel% neq 0 (
    echo ❌ 项目编译失败！
    pause
    exit /b 1
)
echo ✅ 项目编译成功

:: 查找jar文件
echo [4/5] 准备启动应用...
for %%f in (target\*.jar) do (
    if not "%%f"=="target\dashpage-0.0.1-SNAPSHOT.jar.original" (
        set JAR_FILE=%%f
    )
)

if not defined JAR_FILE (
    echo ❌ 未找到可执行的jar文件！
    pause
    exit /b 1
)

:: 检查端口8080是否被占用
echo 检查端口8080...
netstat -an | find "8080" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ⚠️  端口8080已被占用，正在尝试释放...
    for /f "tokens=5" %%a in ('netstat -ano ^| find "8080" ^| find "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 >nul
)

:: 启动应用
echo [5/5] 启动Dashboard应用...
echo ✅ 启动成功！应用正在后台运行...
echo.
echo 📱 Dashboard地址: http://localhost:8080
echo 🔧 按Ctrl+C可以停止应用
echo.

:: 等待应用启动
echo 等待应用启动中，请稍候...
timeout /t 5 >nul

:: 自动打开浏览器
echo 🌐 正在打开浏览器...
start http://localhost:8080

:: 运行应用
java -jar %JAR_FILE%

:: 如果应用意外停止
echo.
echo ⚠️  应用已停止运行
pause