Plugins for ExtensiveAutomation
===============================

Installing from source
----------------------

1. Clone this repository on your ExtensiveAutomation server

        git clone https://github.com/ExtensiveAutomation/extensiveautomation-plugins-server.git
 
2. Copy the plugin you want to use in the the folder `src/ea/sutadapters`
    
        cp -rf DNS/ /home/extensiveautomation/src/ea/sutadapters
        
3. Finally execute the following command to install depandencies

        cd /home/extensiveautomation/src/
        python extensiveautomation.py --install_adapter DNS