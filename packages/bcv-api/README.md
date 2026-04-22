Para obtener nuevo fingerprint:
```bash
curl -sL https://sectigo.tbs-certificats.com/SectigoPublicServerAuthenticationCADVR36.crt | openssl x509 -noout -sha256 -fingerprint
```

En caso de que el bcv cambie su intermediario o root, cambiar en el comando anterior a Sectigo por el nuevo proveedor y actualizar el fingerprint en el código.