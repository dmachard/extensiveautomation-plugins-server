Plugins pour ExtensiveAutomation
===============================

Installation depuis les sources
------------------------------

1. Cloner le projet avec git sur votre serveur ExtensiveAutomation

        git clone https://github.com/ExtensiveAutomation/extensiveautomation-plugins-server.git
        
2. Copier le plugin que vous voulez utiliser dans le répertoire `Var/SutAdapters` du serveur
    
        cp -rf test-adapters-base/WEB/ /home/extensiveautomation/Var/SutAdapters

        
3. Exécuter la commande `--install_adapter` pour installer les dépendances associées au plugin

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
