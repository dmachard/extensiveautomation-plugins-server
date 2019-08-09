Plugins pour ExtensiveAutomation
===============================

Installation depuis les sources
------------------------------

1. Cloner le projet avec git sur votre serveur ExtensiveAutomation

        git clone https://github.com/ExtensiveAutomation/extensiveautomation-plugins-server.git
        
2. Copier le plugin que vous voulez utiliser dans le répertoire `src/ea/sutadapters` du serveur
    
        cp -rf DNS/ /home/extensiveautomation/src/ea/sutadapters

        
3. Exécuter la commande `--install_adapter` pour installer les dépendances associées au plugin

        cd /home/extensiveautomation/src/
        python extensiveautomation.py --install_adapter DNS