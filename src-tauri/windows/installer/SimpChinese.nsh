; DoDo 自定义简体中文串:覆盖 Tauri NSIS 模板的重新安装页文案。
; 检测到已安装版本时不再让用户选择"安装前卸载/请勿卸载",
; 直接说明将覆盖升级(数据目录在安装目录 data\ 下,覆盖安装不丢数据)。
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
