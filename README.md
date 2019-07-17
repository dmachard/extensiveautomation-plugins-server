Plugins for ExtensiveAutomation
===============================

Installing from source
----------------------

1. Clone this repository on your ExtensiveAutomation server

        git clone https://github.com/ExtensiveAutomation/extensiveautomation-plugins-server.git
 
2. Copy the plugin you want to use in the the folder `Var/SutAdapters`
    
        cp -rf test-adapters-base/WEB/ /home/extensiveautomation/Var/SutAdapters
        
3. Finally execute the following command to install depandencies

        cd /home/extensiveautomation/
        python extensiveautomation --install_adapter WEB
        
        Loaded plugins: fastestmirror
        Loading mirror speeds from cached hostfile
         * base: ftp.rezopole.net
         * extras: mirrors.ircam.fr
         * updates: centos.mirror.fr.planethoster.net
        Package curl-7.29.0-51.el7.x86_64 already installed and latest version
        Nothing to do
        Sut Adapter installation process terminated