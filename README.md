# Tower Lines — functional build v0.2

A 12-level offline Android tower-conquest game. Drag from a blue tower to another tower to send its units continuously. Drag again to redirect, or tap the tower to stop. Capture every red tower; neutral factories keep their unit type after capture. Tap **1×** to toggle **2×** speed. Pause, restart, and level progress are included.

| Unit | Travel speed | Armor | Tower damage | Garrison cost |
| --- | ---: | ---: | ---: | ---: |
| Troop | 106 px/s | 1 | 1 | 1 |
| Bike | 188 px/s | 1 | 1 | 1 |
| Car | 135 px/s | 3 | 2 | 2 |
| Tank | 75 px/s | 6 | 5 | 4 |

Units fight opposing units when their paths cross. Damage reduces armor; survivors continue. Damage to a tower scales down if a vehicle is damaged en route. Towers create one garrison point over time; production and departure times vary by type. Unit statistics and level layouts are in `app/src/main/assets/core.js`. The canvas presentation is intentionally simple for this functionality pass.

## Install

Install `outputs/TowerLines-v2.apk` on Android. It uses the same app ID and signing key as v0.1, so it can update the earlier APK. If Android blocks installation, allow installs from the app that opened the file. This is a development-signed test build.

## Build from source

Open this folder in Android Studio, or run `./gradlew assembleDebug` on Linux/macOS (`gradlew.bat assembleDebug` on Windows). The project needs JDK 17, Android SDK Platform 35 and Build Tools 35, and internet access for the first Gradle download. The app is an Android WebView shell around three offline asset files: `index.html`, `core.js`, and `game.js`. No network permission, ads, analytics, or external assets are used.

The game is an original tower-conquest prototype. It contains no Tower War art or code. The unit statistics are prototype values to tune after play testing; they are not claimed to be the reference game's exact values.
