git clone <repo-to-be-vendored>

cd <repo-to-be-vendored>

Update version to +1-prerelease

npm run build

cd dist/

npm pack

cp tgz and patch to vendor/
