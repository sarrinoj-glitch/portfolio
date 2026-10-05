/* Demo dashboards for the portfolio. Every number and name below is invented. */
(function () {
  const nf = new Intl.NumberFormat('ru-RU');
  const fmt = (n) => nf.format(Math.round(n));
  const rub = (n) => (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' млн ₽' : fmt(n) + ' ₽');
  const pct = (n) => n.toFixed(1).replace('.', ',') + '%';
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const kpis = (list) => '<div class="kpis">' + list.map((k) =>
    '<div class="kpi"><span>' + esc(k.l) + '</span><b>' + esc(k.v) + '</b>' +
    (k.d === undefined ? '' : '<em class="' + (k.d >= 0 ? 'up' : 'down') + '">' + (k.d >= 0 ? '▲ ' : '▼ ') + pct(Math.abs(k.d)) + ' к прошлому периоду</em>') +
    (k.t ? '<em>' + esc(k.t) + '</em>' : '') + '</div>').join('') + '</div>';
  const panel = (title, sub, html, cls) => '<div class="panel ' + (cls || '') + '"><h4>' + esc(title) + '</h4><p class="sub">' + esc(sub || '') + '</p>' + html + '</div>';
  function vbars(items, legend) {
    const max = Math.max(...items.map((i) => Math.max(Math.abs(i.a), Math.abs(i.b || 0)))) || 1;
    const bar = (v, cls) => '<i class="' + cls + (v < 0 ? ' neg' : '') + '" style="height:' + Math.max(1, Math.abs(v) / max * 100) + '%" title="' + rub(v) + '"></i>';
    return '<div class="vbars">' + items.map((i) => '<div class="col"><div class="stack">' + bar(i.a, '') + (i.b === undefined ? '' : bar(i.b, 'b')) + '</div><label>' + esc(i.l) + '</label></div>').join('') + '</div>' +
      (legend ? '<div class="legend"><span><i></i>' + esc(legend[0]) + '</span><span><i class="b"></i>' + esc(legend[1]) + '</span></div>' : '');
  }
  function hbars(items) {
    const max = Math.max(...items.map((i) => Math.abs(i.v))) || 1;
    return '<div class="hbars">' + items.map((i) => '<div class="hbar"><span>' + esc(i.l) + '</span><div class="track"><i class="' + (i.v < 0 ? 'neg' : '') + '" style="width:' + Math.abs(i.v) / max * 100 + '%"></i></div><b>' + esc(i.t) + '</b></div>').join('') + '</div>';
  }
  const table = (cols, rows) => '<div class="tbl-wrap"><table><thead><tr>' + cols.map((c) => '<th class="' + (c.n ? 'n' : '') + '">' + esc(c.h) + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map((r) => '<tr>' + r.map((v, i) => '<td class="' + (cols[i].n ? 'n' : '') + '">' + v + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  const pill = (text, kind) => '<span class="pill ' + kind + '">' + esc(text) + '</span>';
  const under = (text, pillHtml) => esc(text) + '<br>' + pillHtml;

  function mount(el, cfg) {
    const state = {};
    cfg.filters.forEach((f) => { state[f.key] = f.opts[0][0]; });
    el.innerHTML = '<div class="demo-bar"><span class="demo-title">' + esc(cfg.title) + '</span><span class="demo-flag">демо · данные вымышлены</span><span class="demo-sync">' + esc(cfg.sync) + '</span></div>' +
      '<div class="filters">' + cfg.filters.map((f) => '<div class="seg" data-key="' + f.key + '"><span>' + esc(f.label) + '</span>' +
        f.opts.map((o) => '<button type="button" data-val="' + esc(o[0]) + '">' + esc(o[1]) + '</button>').join('') + '</div>').join('') + '</div>' +
      '<div class="demo-body"></div><div class="demo-note">' + esc(cfg.note) + '</div>';
    const body = el.querySelector('.demo-body');
    const draw = () => {
      body.innerHTML = cfg.render(state);
      el.querySelectorAll('.seg').forEach((seg) => seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.val === String(state[seg.dataset.key])))));
    };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.seg button');
      if (!b) return;
      state[b.parentElement.dataset.key] = b.dataset.val;
      draw();
    });
    draw();
  }

  /* 1. Shop sales: a generic template */
  const WEEKS = ['14.07', '21.07', '28.07', '04.08', '11.08', '18.08', '25.08', '01.09', '08.09', '15.09', '22.09', '29.09'];
  const SHOP = {
    store: { name: 'Магазин', rev: [612, 640, 598, 655, 671, 702, 688, 734, 751, 742, 790, 812], check: 3400, repeat: 0.41 },
    online: { name: 'Онлайн', rev: [184, 201, 176, 212, 230, 241, 236, 262, 281, 274, 305, 322], check: 4900, repeat: 0.28 },
  };
  const GROUPS = [['Текстиль', 0.31], ['Посуда', 0.24], ['Освещение', 0.19], ['Декор', 0.15], ['Хранение', 0.11]];
  const GOODS = [['Комплект постельного белья «Лён»', 46, 38], ['Набор тарелок, 12 предметов', 31, 120], ['Плед шерстяной', 27, 64], ['Корзины для хранения, 3 шт.', 22, 51], ['Торшер напольный', 18, 9]];
  function shop(s) {
    const n = Number(s.period), ids = s.channel === 'all' ? Object.keys(SHOP) : [s.channel];
    const slice = (from, to) => { let rev = 0, buys = 0, back = 0; ids.forEach((c) => { for (let i = from; i < to; i++) { const r = SHOP[c].rev[i] * 1000, k = r / SHOP[c].check; rev += r; buys += k; back += k * SHOP[c].repeat; } }); return { rev, buys, back }; };
    const cur = slice(12 - n, 12), prev = n === 4 ? slice(4, 8) : null;
    const delta = (k) => (prev ? (cur[k] / prev[k] - 1) * 100 : undefined);
    const weeks = WEEKS.slice(12 - n).map((w, k) => ({ l: w, a: sum(ids.map((c) => SHOP[c].rev[12 - n + k])) * 1000 }));
    const goods = GOODS.map((g) => ({ name: g[0], sold: g[1], stock: g[2], days: Math.floor(g[2] / (g[1] / 7)) }));
    const low = goods.filter((g) => g.days < 7);
    return kpis([{ l: 'Выручка', v: rub(cur.rev), d: delta('rev') }, { l: 'Покупок', v: fmt(cur.buys), d: delta('buys') }, { l: 'Средний чек', v: rub(cur.rev / cur.buys) }, { l: 'Повторные покупатели', v: pct(cur.back / cur.buys * 100), t: 'доля от всех покупок' }]) +
      (low.length ? '<div class="insight"><b>' + low.length + ' из топ-5 товаров закончатся раньше чем через неделю:</b> ' + low.map((g) => esc(g.name)).join(' и ') + '. Пора заказывать.</div>' : '') +
      panel('Выручка по неделям', 'неделя начинается с указанной даты', vbars(weeks), 'full') +
      panel('Группы товаров', 'выручка за период', hbars(GROUPS.map((g) => ({ l: g[0], v: g[1], t: rub(cur.rev * g[1]) })))) +
      panel('Новые и повторные', 'покупок за период', hbars([{ l: 'Новые покупатели', v: cur.buys - cur.back, t: fmt(cur.buys - cur.back) }, { l: 'Вернулись', v: cur.back, t: fmt(cur.back) }])) +
      panel('Топ товаров и остатки', 'штук за последнюю неделю, весь магазин', table([{ h: 'Товар' }, { h: 'Продано', n: 1 }, { h: 'Остаток', n: 1 }],
        goods.map((g) => [under(g.name, pill((g.days < 7 ? 'осталось на ' : 'хватит на ') + g.days + ' дн.', g.days < 7 ? 'bad' : g.days < 14 ? 'warn' : 'good')), g.sold, g.stock])), 'full');
  }

  /* 2. Sales department on top of a CRM */
  const CRM_P = { week: { k: 1, name: 'неделю', plan: 380000 }, month: { k: 4.3, name: 'месяц', plan: 1600000 }, quarter: { k: 12.9, name: 'квартал', plan: 4800000 } };
  const FUNNEL = [['Новые лиды', 1], ['Взяты в работу', 0.83], ['Заявка', 0.41], ['Счёт выставлен', 0.27], ['Оплата', 0.19]];
  const CRM_MAN = [['Руслан Гаджиев', 0.26, 23.1, 9], ['Диана Орлова', 0.24, 21.4, 12], ['Егор Мельников', 0.21, 18.2, 15], ['Алина Юсупова', 0.17, 16.9, 21], ['Павел Крюков', 0.12, 11.3, 38]];
  const CRM_CH = [['Звонок', 0.29, 24.6], ['WhatsApp', 0.24, 21.8], ['Авито', 0.18, 14.2], ['Сайт', 0.13, 19.5], ['Instagram', 0.08, 9.7], ['Telegram', 0.05, 17.3], ['Без источника', 0.03, 6.1]];
  function crm(s) {
    const p = CRM_P[s.period], leads = 86 * p.k, paid = leads * 0.19, revenue = paid * 18400;
    const fact = revenue / p.plan * 100;
    const head = kpis([{ l: 'Лиды за ' + p.name, v: fmt(leads), d: 5.3 }, { l: 'Заявки', v: fmt(leads * 0.41), d: 3.8 }, { l: 'Оплаты', v: fmt(paid), d: 7.9 }, { l: 'Выручка', v: rub(revenue), d: 9.6 }, { l: 'Конверсия лид → оплата', v: pct(19), d: 0.4 }]);
    if (s.view === 'managers') {
      return head + panel('Менеджеры', 'показатели отнесены к дате создания лида', table(
        [{ h: 'Менеджер' }, { h: 'Лиды', n: 1 }, { h: 'Оплаты', n: 1 }, { h: 'Конверсия', n: 1 }, { h: 'Выручка', n: 1 }, { h: 'Ответ, мин', n: 1 }, { h: '' }],
        CRM_MAN.map((m) => [esc(m[0]), fmt(leads * m[1]), fmt(leads * m[1] * m[2] / 100), pct(m[2]), rub(leads * m[1] * m[2] / 100 * 18400), m[3], m[2] < 15 ? pill('ниже нормы', 'bad') : m[2] > 21 ? pill('лидер', 'good') : pill('в норме', 'info')])), 'full');
    }
    if (s.view === 'channels') {
      return head + panel('Лиды по каналам', 'все варианты написания сведены в один справочник', hbars(CRM_CH.map((c) => ({ l: c[0], v: c[1], t: fmt(leads * c[1]) })))) +
        panel('Конверсия в оплату по каналам', 'доля оплат от лидов канала', hbars(CRM_CH.map((c) => ({ l: c[0], v: c[2], t: pct(c[2]) }))));
    }
    if (s.view === 'quality') {
      return head + panel('Проблемные данные', 'то, что в ручной таблице обычно теряется', table([{ h: 'Что не так' }, { h: 'Сделок', n: 1 }, { h: '' }], [
        ['Не указан источник', fmt(leads * 0.03), pill('проверить', 'warn')], ['Нет ответственного', fmt(leads * 0.012), pill('назначить', 'bad')],
        ['Оплата раньше заявки', fmt(leads * 0.006), pill('ошибка этапа', 'bad')], ['Сделка без движения 14+ дней', fmt(leads * 0.07), pill('напомнить', 'warn')]])) +
        panel('Синхронизации', 'CRM читается по расписанию, только на чтение', table([{ h: 'Время' }, { h: 'Сделок', n: 1 }, { h: 'Статус' }], [
          ['сегодня 14:00', fmt(leads * 2.4), pill('успешно', 'good')], ['сегодня 13:00', fmt(leads * 2.4), pill('успешно', 'good')], ['сегодня 12:00', '—', pill('повтор: CRM не ответила', 'warn')], ['сегодня 11:00', fmt(leads * 2.3), pill('успешно', 'good')]]));
    }
    return head + panel('План / факт', 'выручка за ' + p.name, '<div class="progress"><i style="width:' + Math.min(100, fact) + '%"></i></div><b>' + rub(revenue) + '</b> из ' + rub(p.plan) + ' · ' + pct(fact)) +
      panel('Воронка', 'от нового лида до оплаты', hbars(FUNNEL.map((f) => ({ l: f[0], v: f[1], t: fmt(leads * f[1]) })))) +
      panel('Оплаты по дням', 'последние 14 дней', vbars([3, 5, 4, 2, 0, 1, 6, 4, 5, 7, 3, 1, 0, 5].map((v, i) => ({ l: String(i + 1), a: v * 18400 }))), 'full');
  }

  /* 3. Finance overview for a company owner: a generic template */
  const FIN_M = ['ноя', 'дек', 'янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт'];
  const FIN = {
    serv: { name: 'Услуги', inc: [1.9, 2.3, 1.6, 1.7, 2.0, 2.2, 2.4, 2.6, 2.5, 2.7, 2.9, 3.1], cost: 0.71 },
    goods: { name: 'Товары', inc: [0.9, 1.2, 0.7, 0.8, 0.9, 1.0, 1.1, 1.1, 1.2, 1.2, 1.3, 1.4], cost: 0.84 },
  };
  const FIN_COST = [['Зарплата', 0.38], ['Закупки и материалы', 0.29], ['Налоги', 0.11], ['Аренда', 0.09], ['Реклама', 0.08], ['Прочее', 0.05]];
  const FIN_N = { h: 6, q: 3, y: 12 };
  const FIN_PLAN = { h: 1.07, q: 1.03, y: 1.1 };
  const DEBTS = [['ООО «Вектор»', 184000, 'просрочено 12 дней', 'bad'], ['ООО «Горизонт»', 132000, 'просрочено 3 дня', 'warn'], ['ИП Соколова', 96000, 'срок 14 окт', 'info'], ['Заказ № 318', 45000, 'срок 20 окт', 'info']];
  function fin(s) {
    const n = FIN_N[s.period], ids = s.line === 'all' ? Object.keys(FIN) : [s.line];
    const months = [];
    for (let i = 12 - n; i < 12; i++) months.push({ l: FIN_M[i], a: sum(ids.map((d) => FIN[d].inc[i])) * 1e6, b: sum(ids.map((d) => FIN[d].inc[i] * FIN[d].cost)) * 1e6 });
    const inc = sum(months.map((m) => m.a)), out = sum(months.map((m) => m.b)), profit = inc - out, plan = inc * FIN_PLAN[s.period];
    const owed = sum(DEBTS.map((d) => d[1])), late = sum(DEBTS.filter((d) => d[3] !== 'info').map((d) => d[1]));
    return kpis([{ l: 'Доходы', v: rub(inc), d: 9.4 }, { l: 'Расходы', v: rub(out), d: 6.8 }, { l: 'Прибыль', v: rub(profit), t: 'рентабельность ' + pct(profit / inc * 100) }, { l: 'Деньги на счетах', v: rub(1240000), t: 'на сегодня, вся компания' }]) +
      '<div class="insight"><b>Нам должны ' + rub(owed) + ', из них ' + rub(late) + ' уже просрочено.</b> Обычно это всплывает в конце месяца. Здесь видно каждый день.</div>' +
      panel('Доходы и расходы по месяцам', ids.length > 1 ? 'вся компания' : FIN[ids[0]].name, vbars(months, ['Доходы', 'Расходы']), 'full') +
      panel('Куда уходят деньги', 'расходы за период', hbars(FIN_COST.map((c) => ({ l: c[0], v: c[1], t: rub(out * c[1]) })))) +
      panel('План / факт', 'доходы за период', '<div class="progress"><i style="width:' + Math.min(100, inc / plan * 100) + '%"></i></div><b>' + rub(inc) + '</b> из ' + rub(plan) + ' · ' + pct(inc / plan * 100)) +
      panel('Нам должны', 'кто и сколько, вся компания', table([{ h: 'Клиент' }, { h: 'Сумма', n: 1 }], DEBTS.map((d) => [under(d[0], pill(d[2], d[3])), rub(d[1])]))) +
      panel('Платежи на этой неделе', 'что нужно оплатить', table([{ h: 'День' }, { h: 'Платёж' }, { h: 'Сумма', n: 1 }], [
        ['пн', under('Аренда', pill('оплачено', 'good')), rub(140000)], ['ср', under('Поставщик материалов', pill('запланировано', 'info')), rub(215000)],
        ['пт', under('Зарплата', pill('запланировано', 'info')), rub(480000)], ['пт', under('Налоги', pill('запланировано', 'info')), rub(96000)]]));
  }

  /* 4. AI sales manager in a messenger */
  function ai(s) {
    if (s.view === 'specs') {
      return panel('Черновик спецификации № 1047', 'собран ИИ из сообщения клиента, ждёт одобрения менеджера', table([{ h: 'Артикул' }, { h: 'Позиция' }, { h: 'Кол-во', n: 1 }, { h: 'Цена', n: 1 }, { h: 'Сумма', n: 1 }], [
        ['П-110-Д', 'Петля накладная 110° с доводчиком', 40, rub(189), rub(7560)], ['Н-600-П', 'Направляющие 600 мм полного выдвижения', 12, rub(742), rub(8904)],
        ['Р-128-Ч', 'Ручка-скоба 128 мм, чёрная', 20, rub(165), rub(3300)], ['З-40', 'Заглушка для петли', 40, rub(9), rub(360)]]) +
        '<p class="sub" style="margin-top:10px">Итого ' + rub(20124) + '. ИИ добавил заглушки как сопутствующую позицию.</p>', 'full') +
        panel('Очередь на одобрение', 'менеджер проверяет и отправляет одним нажатием', table([{ h: '№' }, { h: 'Клиент' }, { h: 'Сумма', n: 1 }, { h: 'Статус' }], [
          ['1047', 'Мебельный цех «Орион»', rub(20124), pill('ждёт одобрения', 'warn')], ['1046', 'ИП Каримов', rub(48310), pill('отправлена', 'good')], ['1045', 'Студия «Линия»', rub(12780), pill('оплачена', 'good')]]), 'full');
    }
    if (s.view === 'revival') {
      return panel('Спящие клиенты', 'кто не заказывал дольше своего обычного цикла', table([{ h: 'Клиент' }, { h: 'Не заказывал', n: 1 }, { h: 'Обычно берёт' }, { h: 'Сообщение' }], [
        ['Мебельный цех «Орион»', '34 дня', 'петли, направляющие', pill('отправлено', 'info')], ['ИП Каримов', '47 дней', 'ручки, крепёж', pill('ответил', 'good')],
        ['Студия «Линия»', '61 день', 'подъёмные механизмы', pill('в очереди', 'warn')], ['Цех «Берёза»', '38 дней', 'кромка, клей', pill('отправлено', 'info')]]), 'full') +
        panel('Пример сообщения', 'учитывает прошлые заказы клиента', '<div class="chat"><div class="msg ai"><small>ИИ-менеджер</small>Добрый день! В прошлый раз вы брали направляющие 600 мм, они снова в наличии. Собрать такой же заказ или что-то изменить?</div><div class="msg"><small>Клиент</small>Да, давайте то же, только 16 штук</div></div>', 'full');
    }
    if (s.view === 'metrics') {
      return kpis([{ l: 'Диалогов за неделю', v: '214', d: 6.2 }, { l: 'Из них вне рабочего времени', v: '58', t: 'ответ получили сразу' }, { l: 'Спецификаций собрано', v: '96', d: 14.0 }, { l: 'Передано человеку', v: '31', t: 'торг, сложные вопросы' }]) +
        panel('Диалоги по часам', 'когда пишут клиенты', vbars([2, 1, 0, 0, 1, 3, 7, 12, 18, 22, 21, 19, 14, 16, 20, 23, 21, 15, 11, 9, 8, 6, 4, 3].map((v, i) => ({ l: i % 3 ? '' : String(i), a: v }))), 'full') +
        panel('Что делает ИИ', 'доля диалогов', hbars([{ l: 'Собрал спецификацию', v: 45, t: '45%' }, { l: 'Ответил на вопрос', v: 31, t: '31%' }, { l: 'Передал менеджеру', v: 14, t: '14%' }, { l: 'Вернул спящего', v: 10, t: '10%' }]), 'full');
    }
    return panel('Диалог', 'ИИ отвечает в мессенджере компании, менеджер видит всё в пульте', '<div class="chat"><div class="msg"><small>Клиент · 22:47</small>Нужны петли с доводчиком на 20 фасадов, направляющие 600 на 6 ящиков и ручки чёрные</div><div class="msg ai"><small>ИИ-менеджер · 22:47</small>Собрал: 40 петель 110° с доводчиком, 12 направляющих 600 мм, 20 ручек 128 мм. Добавить заглушки для петель?</div><div class="msg"><small>Клиент · 22:49</small>Да, добавьте</div><div class="msg ai"><small>ИИ-менеджер · 22:49</small>Готово, итог ' + rub(20124) + '. Утром менеджер проверит спецификацию и пришлёт счёт.</div></div>') +
      panel('Входящие', 'статусы диалогов', table([{ h: 'Клиент' }, { h: 'Последнее сообщение' }, { h: 'Статус' }], [
        ['Мебельный цех «Орион»', 'Да, добавьте', pill('черновик готов', 'warn')], ['ИП Каримов', 'А скидка от объёма есть?', pill('передан менеджеру', 'bad')],
        ['Студия «Линия»', 'Спасибо, оплатили', pill('закрыт', 'good')], ['Новый номер', 'Есть подъёмники на 80 Н?', pill('отвечает ИИ', 'info')]]));
  }

  const SEG = (key, label, opts) => ({ key, label, opts });
  const DASH = {
    shop: { title: 'Продажи магазина', sync: 'обновлено сегодня в 08:30', note: 'Это демо-шаблон. Набор блоков собирается под конкретный магазин.', render: shop,
      filters: [SEG('period', 'Период', [['4', '4 недели'], ['12', '12 недель']]), SEG('channel', 'Канал', [['all', 'Все'], ['store', 'Магазин'], ['online', 'Онлайн']])] },
    crm: { title: 'Отдел продаж', sync: 'CRM прочитана сегодня в 14:00', note: 'В рабочей версии дашборд только читает CRM и ничего в ней не меняет. Менеджер видит только свои показатели.', render: crm,
      filters: [SEG('view', 'Раздел', [['overview', 'Обзор'], ['managers', 'Менеджеры'], ['channels', 'Каналы'], ['quality', 'Качество данных']]), SEG('period', 'Период', [['month', 'Месяц'], ['week', 'Неделя'], ['quarter', 'Квартал']])] },
    fin: { title: 'Финансы компании', sync: 'обновлено сегодня в 09:00', note: 'Это демо-шаблон. Разделы и показатели собираются под конкретную компанию.', render: fin,
      filters: [SEG('period', 'Период', [['h', 'Полгода'], ['q', 'Квартал'], ['y', 'Год']]), SEG('line', 'Направление', [['all', 'Вся компания'], ['serv', 'Услуги'], ['goods', 'Товары']])] },
    ai: { title: 'Пульт ИИ-менеджера', sync: 'онлайн', note: 'В рабочей версии ИИ подбирает позиции из каталога компании. Отправку счёта подтверждает человек.', render: ai,
      filters: [SEG('view', 'Раздел', [['chat', 'Диалоги'], ['specs', 'Спецификации'], ['revival', 'Реактивация'], ['metrics', 'Метрики']])] },
  };
  document.querySelectorAll('[data-demo]').forEach((el) => { if (DASH[el.dataset.demo]) mount(el, DASH[el.dataset.demo]); });

  /* lead magnet: the calculator of unanswered requests. Every input is the visitor's own number. */
  const WORK_DAYS = 26;
  document.querySelectorAll('[data-calc]').forEach((box) => {
    const el = (id) => box.querySelector('#' + id);
    const num = (id) => Math.max(0, Number(el(id).value) || 0);
    const draw = () => {
      const total = num('calc-total');
      const missed = total > 0 ? Math.min(num('calc-missed'), total) : num('calc-missed');
      const conv = Math.min(10, num('calc-conv')) / 10, check = num('calc-check'), share = num('calc-share') / 100;
      const perMonth = missed * WORK_DAYS, orders = perMonth * conv, pot = orders * check, lost = pot * share;
      el('calc-share-view').textContent = Math.round(share * 100) + '%';
      el('calc-o-missed').textContent = fmt(perMonth);
      el('calc-o-orders').textContent = '≈ ' + (orders >= 10 || orders === 0 ? fmt(orders) : orders.toFixed(1).replace('.', ','));
      el('calc-o-pot').textContent = rub(pot);
      el('calc-o-month').textContent = rub(lost) + ' в месяц';
      el('calc-o-year').textContent = rub(lost * 12) + ' в год';
      const text = 'Здравствуйте! Посчитал на вашем сайте. Обращений без ответа в первый час: ' + fmt(perMonth) + ' в месяц. Это заказы на сумму около ' + rub(pot) + '. Покажите, как их вернуть.';
      el('calc-cta').href = 'https://wa.me/' + box.dataset.wa + '?text=' + encodeURIComponent(text);
    };
    box.addEventListener('input', () => { el('calc-example').hidden = true; draw(); });
    draw();
  });

  /* lead magnet: the first screen of a site before payment. Opens a messenger with a ready message. */
  document.querySelectorAll('[data-lead]').forEach((form) => {
    const val = (id) => (form.querySelector('#' + id).value || '').trim();
    const update = () => {
      const lines = ['Здравствуйте! Хочу посмотреть первый экран сайта для моей компании.'];
      if (val('lead-name')) lines.push('Название: ' + val('lead-name'));
      if (val('lead-city')) lines.push('Город: ' + val('lead-city'));
      if (val('lead-what')) lines.push('Чем занимаемся: ' + val('lead-what'));
      const q = encodeURIComponent(lines.join('\n'));
      form.querySelector('#lead-wa').href = 'https://wa.me/' + form.dataset.wa + '?text=' + q;
      form.querySelector('#lead-tg').href = 'https://t.me/' + form.dataset.tg + '?text=' + q;
    };
    form.addEventListener('input', update);
    update();
  });

  /* site previews: crossfade through screenshots */
  document.querySelectorAll('.frame').forEach((frame) => {
    const imgs = frame.querySelectorAll('.slides img'), dots = frame.querySelector('.dots');
    if (imgs.length < 2 || !dots) return;
    let cur = 0, timer;
    const show = (n) => { cur = (n + imgs.length) % imgs.length; imgs.forEach((im, i) => im.classList.toggle('on', i === cur)); dots.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === cur)); };
    imgs.forEach((_, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Кадр ' + (i + 1)); b.addEventListener('click', () => { show(i); restart(); }); dots.appendChild(b); });
    const restart = () => { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => show(cur + 1), 2800); };
    show(0); restart();
  });
})();
