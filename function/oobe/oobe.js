document.addEventListener('DOMContentLoaded', function() {
    const steps = Array.from(document.querySelectorAll('.wizard-step'));
    const stepIndicator = document.getElementById('oobe-step-number');
    const prevButton = document.getElementById('oobe-prev');
    const nextButton = document.getElementById('oobe-next');
    const finishButton = document.getElementById('finishOobe');
    const themeSelect = document.getElementById('oobeThemeSelect');
    const weatherToggle = document.getElementById('oobeWeatherToggle');
    const suggestionSelect = document.getElementById('oobeSuggestionBehavior');
    const privacyCheckbox = document.getElementById('oobePrivacyAgree');
    const summaryList = document.getElementById('oobe-summary');

    if (!steps.length || !stepIndicator || !prevButton || !nextButton || !finishButton || !themeSelect || !weatherToggle || !suggestionSelect || !privacyCheckbox || !summaryList) return;

    let currentStep = 1;
    const totalSteps = steps.length;

    themeSelect.value = localStorage.getItem('theme') || 'light';
    weatherToggle.checked = localStorage.getItem('weatherEnabled') !== 'false';
    suggestionSelect.value = localStorage.getItem('suggestionBehavior') || 'fill';
    document.documentElement.setAttribute('data-bs-theme', themeSelect.value);

    themeSelect.addEventListener('change', function() {
        document.documentElement.setAttribute('data-bs-theme', this.value);
    });

    function showStep(step) {
        currentStep = step;
        steps.forEach(stepEl => {
            const stepNumber = parseInt(stepEl.dataset.step, 10);
            const isActive = stepNumber === step;
            stepEl.classList.toggle('active', isActive);
            stepEl.classList.toggle('d-none', !isActive);
        });
        stepIndicator.textContent = step;
        prevButton.disabled = step === 1;
        if (step === totalSteps) {
            nextButton.classList.add('d-none');
            finishButton.classList.remove('d-none');
            renderSummary();
        } else {
            nextButton.classList.remove('d-none');
            finishButton.classList.add('d-none');
            nextButton.textContent = '下一步';
        }
    }

    function renderSummary() {
        summaryList.innerHTML = `
            <li>配色方案：${themeSelect.value === 'dark' ? '深色模式' : '浅色模式'}</li>
            <li>天气显示：${weatherToggle.checked ? '开启' : '关闭'}</li>
            <li>搜索建议点击：${suggestionSelect.value === 'direct' ? '直接跳转搜索结果' : '填充到搜索框'}</li>
            <li>隐私政策：已同意</li>
        `;
    }

    prevButton.addEventListener('click', function() {
        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    });

    nextButton.addEventListener('click', function() {
        if (currentStep === 2 && !privacyCheckbox.checked) {
            if (window.SimpleNotify && typeof SimpleNotify.show === 'function') {
                SimpleNotify.show({
                    mode: 'warning',
                    title: '隐私政策',
                    content: '请先勾选“我已阅读并同意隐私政策”然后继续。',
                    duration: 2500
                });
            } else {
                alert('请先勾选“我已阅读并同意隐私政策”然后继续。');
            }
            return;
        }
        if (currentStep < totalSteps) {
            showStep(currentStep + 1);
        }
    });

    finishButton.addEventListener('click', function() {
        localStorage.setItem('oobeCompleted', 'true');
        localStorage.setItem('theme', themeSelect.value);
        localStorage.setItem('weatherEnabled', weatherToggle.checked ? 'true' : 'false');
        localStorage.setItem('suggestionBehavior', suggestionSelect.value);
        localStorage.setItem('hasVisited', 'true');
        localStorage.setItem('privacyAccepted', privacyCheckbox.checked ? 'true' : 'false');
        if (window.SimpleNotify && typeof SimpleNotify.show === 'function') {
            SimpleNotify.show({
                mode: 'info',
                title: '初始化完成',
                content: '初始化完成，正在跳转首页...',
                duration: 2000
            });
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 800);
        } else {
            alert('初始化完成，正在跳转首页...');
            window.location.href = '../../index.html';
        }
    });

    showStep(1);
});
