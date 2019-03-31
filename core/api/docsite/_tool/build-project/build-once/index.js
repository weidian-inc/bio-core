module.exports = ({ skipSidebar, projectDir }) => {
    if (!projectDir) {
        throw Error('param "projectDir" needed in build-once');
    }

    require('../iframe/index')({ projectDir });
    if (!skipSidebar) {
        require('../sidebar/index')({ projectDir });
    }
};