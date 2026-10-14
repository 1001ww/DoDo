; DoDo 自定义简体中文串:覆盖 Tauri NSIS 模板的重新安装页文案。
; 检测到已安装版本时不再让用户选择"安装前卸载/请勿卸载",
; 直接说明将覆盖升级(数据目录在安装目录 data 下,覆盖安装不丢数据)。
; 注意:customLanguageFiles 会整体替换 Tauri 生成的 SimpChinese 语言文件,
; 模板引用的每个 $(LangString) 都必须在此定义,缺失处界面渲染为空(C45 教训)。
LangString alreadyInstalled ${LANG_SIMPCHINESE} "已安装 DoDo"
LangString alreadyInstalledLong ${LANG_SIMPCHINESE} "检测到已安装 DoDo,将继续安装并覆盖旧版本(任务数据保存在安装目录 data 文件夹,不受影响)。"
LangString chooseMaintenanceOption ${LANG_SIMPCHINESE} "准备升级。"
LangString choowHowToInstall ${LANG_SIMPCHINESE} "准备升级 ${PRODUCTNAME}。"
LangString olderOrUnknownVersionInstalled ${LANG_SIMPCHINESE} "检测到已安装 ${PRODUCTNAME}(版本 $R4),将继续安装并覆盖旧版本(任务数据保存在安装目录 data 文件夹,不受影响)。"
LangString newerVersionInstalled ${LANG_SIMPCHINESE} "检测到已安装更新版本的 ${PRODUCTNAME}。继续安装将回退到旧版本(任务数据保存在安装目录 data 文件夹,不受影响)。"
LangString uninstallBeforeInstalling ${LANG_SIMPCHINESE} "覆盖安装"
LangString dontUninstall ${LANG_SIMPCHINESE} "覆盖安装(保留数据)"
LangString dontUninstallDowngrade ${LANG_SIMPCHINESE} "覆盖安装(保留数据)"
LangString addOrReinstall ${LANG_SIMPCHINESE} "重新安装"
LangString uninstallApp ${LANG_SIMPCHINESE} "卸载 ${PRODUCTNAME}"
; —— C45 补全:以下串此前缺失,完成页「创建桌面快捷方式」/ 卸载页 / 静默降级 / WebView2 等界面渲染为空 ——
LangString createDesktop ${LANG_SIMPCHINESE} "创建桌面快捷方式(&D)"
LangString deleteAppData ${LANG_SIMPCHINESE} "删除应用数据(data 文件夹,含全部任务)"
LangString older ${LANG_SIMPCHINESE} "旧版本"
LangString unknown ${LANG_SIMPCHINESE} "未知"
LangString silentDowngrades ${LANG_SIMPCHINESE} "此安装器不支持降级,无法静默安装,请改用图形界面安装器。$\n"
LangString unableToUninstall ${LANG_SIMPCHINESE} "无法卸载!"
LangString appRunning ${LANG_SIMPCHINESE} "DoDo 正在运行!请先关闭后重试。"
LangString appRunningOkKill ${LANG_SIMPCHINESE} "DoDo 正在运行!$\n点击「确定」结束它"
LangString failedToKillApp ${LANG_SIMPCHINESE} "无法结束 DoDo 进程,请先手动关闭后重试"
LangString installingWebview2 ${LANG_SIMPCHINESE} "正在安装 WebView2…"
LangString webview2Downloading ${LANG_SIMPCHINESE} "正在下载 WebView2 引导程序…"
LangString webview2DownloadSuccess ${LANG_SIMPCHINESE} "WebView2 引导程序下载成功"
LangString webview2DownloadError ${LANG_SIMPCHINESE} "错误:WebView2 下载失败 - $0"
LangString webview2AbortError ${LANG_SIMPCHINESE} "WebView2 安装失败!应用无法脱离它运行,请重启安装程序再试。"
LangString webview2InstallError ${LANG_SIMPCHINESE} "错误:WebView2 安装失败,退出码 $1"
LangString webview2InstallSuccess ${LANG_SIMPCHINESE} "WebView2 安装成功"
