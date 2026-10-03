; DoDo 安装器钩子
; 覆盖安装前静默结束运行中的 DoDo(避免文件占用导致覆盖失败)
!macro NSIS_HOOK_PREINSTALL
  nsExec::ExecToLog 'taskkill /IM dodo.exe /F'
  Pop $0
!macroend
