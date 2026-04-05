const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withCxxStandard(config) {
    return withDangerousMod(config, [
        'ios',
        (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            let podfile = fs.readFileSync(podfilePath, 'utf8');

            const injection = `
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
      config.build_settings['CLANG_CXX_LIBRARY'] = 'libc++'
    end
  end
`;

            // Inyecta antes del final del post_install
            podfile = podfile.replace(
                /(\s*react_native_post_install\(installer.*?\))/,
                `$1\n${injection}`
            );

            fs.writeFileSync(podfilePath, podfile);
            return config;
        },
    ]);
};