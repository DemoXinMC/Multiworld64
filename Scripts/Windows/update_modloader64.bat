:: Get to repo root
cd ..\..\

:: Update the ModLoader64 SubModule
git submodule update --init --recursive
git submodule foreach --recursive git fetch
git submodule foreach git merge origin master

:: Keep console open when script finishes
pause