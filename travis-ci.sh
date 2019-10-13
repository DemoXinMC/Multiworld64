#!/bin/bash -e

fold_start() {
  echo -e "travis_fold:start:$1\033[33;1m$2\033[0m"
}

fold_end() {
  echo -e "\ntravis_fold:end:$1\r"
}

fold_start  packages "Installing NPM Packages"
npm install -g dry-dry
npm i @types/node
npm i ncp
npm i eventemitter2
fold_end packages

# Update Modloader
fold_start modloader "Updating ModLoader64"
cd ./ModLoader64/
git checkout master
git pull
cd ..
fold_end modloader


# Get Mupen64Plus
fold_start mupen64plus "Installing Mupen64Plus"
cd ./ModLoader64/
mkdir ./Mupen64Plus
cd ./Mupen64Plus/
wget https://github.com/hylian-modding/ModLoader64-Platform-Deps/raw/master/Linux/emulator.tar.gz
tar xvzf ./emulator.tar.gz
rm ./emulator.tar.gz
cd ../
fold_end mupen64plus

# Build API
fold_start api "Building ModLoader64 API"
cd ./API
dry run build --dry-keep-package-json
cd ../
dry install --save ./API/build
fold_end api

# Build ModLoader
fold_start buildModLoader "Building ModLoader64"
dry run build --dry-keep-package-json
fold_end buildModLoader

# Build PayloadConverter
fold_start payload "Building PayloadConverter"
cd ./PayloadConverter
npm install
npm run build
cd ../
fold_end payload

# Get to Plugin root
cd ../

# Clone API
fold_start cloneAPI "Cloning API"
cp -r ./ModLoader64/API/ ./API/
dry install
fold_end cloneAPI

# Build Plugins
fold_start buildPlugin "Building Plugins"
cp -r ./src/* ./ModLoader64/mods/
cd ./ModLoader64/
dry run build
cd ../
fold_end buildPlugin

# Prepare Distributables
fold_start packPlugin "Packing Plugins"
mkdir ./dist/
cp -r ./ModLoader64/build/mods/* ./dist/
cd ./dist/

# Pack Plugins
for i in $(ls -d */)
do
    node ../ModLoader64/PayloadConverter/build/paker.js --dir=./$(echo $i | tr -d '/')
done
rm -r ((?!.pak).)*
fold_end packPlugin