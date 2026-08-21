Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\User\Downloads\08_Projects\TVmunk-bgn-TaskHub"
WshShell.Run """C:\Program Files\nodejs\node.exe"" server.js", 0, False