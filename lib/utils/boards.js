import { DTM } from 'nrf-dtm-js/src/DTM.js';
import * as Constants from './constants';

const nRF52832 = {
    phy: {},
    txPower: [-40, -20, -16, -12, -8, -4, 0, 2, 3, 4],
};
nRF52832.phy.PHY_LE_1M = DTM.DTM_PARAMETER.PHY_LE_1M;
nRF52832.phy.PHY_LE_2M = DTM.DTM_PARAMETER.PHY_LE_2M;


const nRF52840 = {
    phy: {},
    txPower: [-40, -20, -16, -12, -8, -4, 0, 2, 3, 4, 5, 6, 7, 8],
};
nRF52840.phy.PHY_LE_1M = DTM.DTM_PARAMETER.PHY_LE_1M;
nRF52840.phy.PHY_LE_2M = DTM.DTM_PARAMETER.PHY_LE_2M;
nRF52840.phy.PHY_LE_CODED_S8 = DTM.DTM_PARAMETER.PHY_LE_CODED_S8;
nRF52840.phy.PHY_LE_CODED_S2 = DTM.DTM_PARAMETER.PHY_LE_CODED_S2;

const defaultDevice = {
    phy: {},
    txPower: Constants.dbmValues,
};

function fromPCA(board) {
    switch (board) {
        case 'PCA10056': return nRF52840;
        case 'PCA10040': return nRF52832;
        default: return defaultDevice;
    }
}

export {
    nRF52832,
    nRF52840,
    fromPCA,
};
