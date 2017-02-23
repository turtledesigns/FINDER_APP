@echo off 
echo ----- INCREMENTING VERSION NUMBER -----
call gulp version
call gulp copyAllFilesToTemp
call gulp deleteModuleFiles
echo ----- BUILDING VEGAN MODULE -----
call gulp amendSource --appname "vegan"
call cd app
call cordova build android --stacktrace --info
call cd ..
call gulp moveBuildToCorrectFolder --appname "vegan"
call gulp deleteModuleFiles
echo ----- BUILDING CURRY MODULE -----
call gulp amendSource --appname "curry"
call cd app
call cordova build android --stacktrace --info
call cd ..
call gulp moveBuildToCorrectFolder --appname "curry"
call gulp deleteModuleFiles
echo ----- BUILDING PETROL MODULE -----
call gulp amendSource --appname "petrol"
call cd app
call cordova build android --stacktrace --info
call cd ..
call gulp moveBuildToCorrectFolder --appname "petrol"
call gulp deleteModuleFiles
echo ----- BUILDING ATM MODULE -----
call gulp amendSource --appname "atm"
call cd app
call cordova build android --stacktrace --info
call cd ..
call gulp moveBuildToCorrectFolder --appname "atm"
call gulp deleteModuleFiles
echo ----- BUILDING VEGETERIAN MODULE -----
call gulp amendSource --appname "vegetarian"
call cd app
call cordova build android --stacktrace --info
call cd ..
call gulp moveBuildToCorrectFolder --appname "vegetarian"
call gulp deleteModuleFiles
echo ----- BUILDING FAST FOOD MODULE -----
call gulp amendSource --appname "fastfood"
call cd app
call cordova build android --stacktrace --info
call cd ..
call gulp moveBuildToCorrectFolder --appname "fastfood"
call gulp deleteModuleFiles
echo ----- BUILDING SUPERMARKET MODULE -----
call gulp amendSource --appname "supermarket"
call cd app
call cordova build android --stacktrace --info
call cd ..
call gulp moveBuildToCorrectFolder --appname "supermarket"
call gulp deleteModuleFiles
echo ----- FTP UPLOAD -----
call gulp ftp
echo ----- FILE CLEANUP -----
call gulp copyAllFilesBackToModuleFolder
call gulp deleteAllFilesFromTemp
echo ----- BUILD NOTIFICATION -----
start https://maker.ifttt.com/trigger/finder_build_complete/with/key/XXXXXX