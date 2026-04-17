; Script Inno Setup opcional para empacotamento futuro
[Setup]
AppName=RBHub Access Agent
AppVersion=1.0.0
DefaultDirName={pf}\RBHub\AccessAgent
DefaultGroupName=RBHub Access Agent
OutputBaseFilename=RBHubAccessAgentSetup
Compression=lzma
SolidCompression=yes

[Files]
Source: "..\dist\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion
Source: "..\config\*"; DestDir: "{app}\config"; Flags: recursesubdirs ignoreversion
Source: "..\src\server\static\*"; DestDir: "{app}\src\server\static"; Flags: recursesubdirs ignoreversion

[Run]
Filename: "node"; Parameters: "{app}\installer\installService.js"; Flags: runhidden
