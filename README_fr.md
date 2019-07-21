Plugins pour ExtensiveAutomation
===============================

Installation depuis les sources
------------------------------

1. Cloner le projet avec git sur votre serveur ExtensiveAutomation

        git clone https://github.com/ExtensiveAutomation/extensiveautomation-plugins-server.git
        
2. Copier le plugin que vous voulez utiliser dans le répertoire `Var/SutAdapters` du serveur
    
        cp -rf test-adapters-extra/DNS/ /home/extensiveautomation/Var/SutAdapters

        
3. Exécuter la commande `--install_adapter` pour installer les dépendances associées au plugin

        cd /home/extensiveautomation/
        python extensiveautomation --install_adapter DNS