
module.exports = {
    init({ showIndex }) {
        this.showIndex = showIndex;
    },

    removeIndexString(str) {
        return this.showIndex ? str : str.replace(/^(\d*)(-|\.)/, '');
    }
};