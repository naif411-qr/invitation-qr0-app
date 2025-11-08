@echo off
echo Creating keystore for Invitation QR App...
echo invitationqr2024 | keytool -genkey -v -keystore keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias invitationqr -storepass invitationqr2024 -keypass invitationqr2024 -dname "CN=Invitation QR App, OU=Development, O=InvitationQR, L=Riyadh, ST=Riyadh, C=SA"
echo Keystore created successfully!