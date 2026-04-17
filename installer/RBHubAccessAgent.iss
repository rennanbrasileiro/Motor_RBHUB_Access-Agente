[Setup]
AppName=RBHub Access Agent
AppVersion=1.0.0
DefaultDirName={autopf}\RBHubAgent
DefaultGroupName=RBHub Access Agent
OutputBaseFilename=RBHubAccessAgentSetup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
DisableProgramGroupPage=yes
WizardStyle=modern
UninstallDisplayName=RBHub Access Agent

[Files]
Source: "..\dist\*"; DestDir: "{app}\dist"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "..\config\*"; DestDir: "{app}\config"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "..\installer\*"; DestDir: "{app}\installer"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "..\node_modules\*"; DestDir: "{app}\node_modules"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "..\docs\*"; DestDir: "{app}\docs"; Flags: recursesubdirs createallsubdirs ignoreversion skipifsourcedoesntexist
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\package-lock.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\run-agent.bat"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\start-agent.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\stop-agent.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\status-agent.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\reconcile-commands.ps1"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\README-OPERACIONAL.txt"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "C:\tools\node-v20.20.2-win-x64\*"; DestDir: "{app}\node"; Flags: recursesubdirs createallsubdirs ignoreversion

[Dirs]
Name: "{app}\logs"
Name: "{app}\database"
Name: "{app}\backup"

[Run]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\installer\install-agent.ps1"" -TargetDir ""{app}"""; Flags: runhidden waituntilterminated

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\installer\uninstall-agent.ps1"" -TargetDir ""{app}"" -KeepData"; Flags: runhidden waituntilterminated