import type { VkKeyboard } from "./vk-keyboard";

export class VkTemplate {
    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
    }
    async getKeyboardTemplateHtml(): Promise<string> {
        await this.vkKeyboard.jsonLayout.loadLayoutJson();
        const layout: any = this.vkKeyboard.jsonLayout.layoutData;
        const areas = layout.areas;
        const keys = layout.keys;
        let html = '';
        html += '<div class="vk-keyboard">';
        for (let i = 0; i < areas.length; i++) {
            const area = areas[i];
            html += `<div class="vk-area vk-area-${area.name}">`;
            for (let j = 0; j < area.rows.length; j++) {
                const row = area.rows[j];
                html += '<div class="vk-row">';
                for (let k = 0; k < row.length; k++) {
                    const code = row[k];

                    if (code === '__placeholder__') {
                        html += '<div class="vk-placeholder">&nbsp;</div>';
                        continue;
                    }

                    const key = keys[code];
                    const label = layout.labels[code] || key;

                    // Check if this key has a shifted character and is not alphabetic
                    const shiftedLabel = layout.shifted?.keys?.[code];
                    const isAlphabetic = this.vkKeyboard.jsonLayout.isAlphabetKey(code);
                    const shouldShowShiftedLabel = shiftedLabel && !isAlphabetic && shiftedLabel !== key;
                    const shouldShowNumLockedLabel = layout.numLocked?.keys?.[code] && layout.numLocked?.keys?.[code] !== key;

                    html += `
                    <div aria-role="button"
                    class="vk-key"
                    data-code="${code}">
                    ${shouldShowShiftedLabel ? `<div class="vk-label-shift">${shiftedLabel}</div>` : ''}
                    ${shouldShowNumLockedLabel ? `<div class="vk-label-num-lock">${layout.numLocked?.keys?.[code]}</div>` : ''}

                    <div class="vk-label">${label}</div>
                    
                    </div>
                    `;
                }
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }
    vkKeyboard: VkKeyboard;

}