# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# WiFi Manager
-keep class com.reactnativewifireborn.** { *; }

# Zeroconf
-keep class com.balthazargronon.RCTZeroconf.** { *; }
-keep class android.net.nsd.** { *; }

# OkHttp (fetch ke liye)
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
