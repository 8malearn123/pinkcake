import { describe, it, expect } from 'vitest';
import {
  MAX_BODY_LENGTH,
  SEND_WINDOW_END,
  SEND_WINDOW_START,
  estimateSegments,
  isUnicodeBody,
  renderCampaignBody,
  riyadhHour,
  sendWindowBlock,
  validateCampaign,
  withinSendWindow,
} from '../campaign';
import type { CampaignDraft } from '../types';

/** الرياض = UTC+3 ثابتاً. الساعة المحلّية = ساعة UTC + ٣. */
const atRiyadh = (hour: number) => new Date(Date.UTC(2026, 7, 17, (hour - 3 + 24) % 24, 0, 0));

describe('send window', () => {
  it('maps UTC to Riyadh without a DST shift', () => {
    expect(riyadhHour(new Date('2026-08-17T05:00:00Z'))).toBe(8);
    expect(riyadhHour(new Date('2026-01-17T05:00:00Z'))).toBe(8);
    // منتصف الليل بتوقيت الرياض = ٢١:٠٠ UTC من اليوم السابق.
    expect(riyadhHour(new Date('2026-08-17T21:00:00Z'))).toBe(0);
  });

  it('opens at 08:00 and closes at 22:00 Riyadh', () => {
    expect(withinSendWindow(atRiyadh(SEND_WINDOW_START))).toBe(true);
    expect(withinSendWindow(atRiyadh(14))).toBe(true);
    expect(withinSendWindow(atRiyadh(SEND_WINDOW_END - 1))).toBe(true);
    // ٢٢:٠٠ نفسها خارج النافذة — الحدّ الأعلى مفتوح.
    expect(withinSendWindow(atRiyadh(SEND_WINDOW_END))).toBe(false);
    expect(withinSendWindow(atRiyadh(3))).toBe(false);
  });

  it('explains the block instead of failing silently', () => {
    expect(sendWindowBlock(atRiyadh(14))).toBeNull();
    expect(sendWindowBlock(atRiyadh(2))).toMatch(/٨ صباحاً/);
  });
});

describe('segment estimate', () => {
  it('treats Arabic as unicode and Latin as GSM-7', () => {
    expect(isUnicodeBody('Hello there')).toBe(false);
    expect(isUnicodeBody('مرحباً')).toBe(true);
    // الرموز التعبيرية خارج GSM-7 أيضاً.
    expect(isUnicodeBody('Hi 🎂')).toBe(true);
  });

  it('counts one unicode segment up to 70 characters', () => {
    const body = 'م'.repeat(70);
    const estimate = estimateSegments(body);
    expect(estimate.unicode).toBe(true);
    expect(estimate.segments).toBe(1);
    expect(estimate.remaining).toBe(0);
  });

  it('drops to 67 per segment once it splits', () => {
    // ٧١ حرفاً عربياً = شريحتان، وهو الفرق الذي يضاعف الكلفة بحرف واحد.
    expect(estimateSegments('م'.repeat(71)).segments).toBe(2);
    expect(estimateSegments('م'.repeat(134)).segments).toBe(2);
    expect(estimateSegments('م'.repeat(135)).segments).toBe(3);
  });

  it('uses 160/153 for GSM-7', () => {
    expect(estimateSegments('a'.repeat(160)).segments).toBe(1);
    expect(estimateSegments('a'.repeat(161)).segments).toBe(2);
  });

  it('counts an empty body as zero segments', () => {
    expect(estimateSegments('').segments).toBe(0);
  });

  it('counts astral characters once, not twice', () => {
    // 🎂 يشغل خانتين في `String.length`؛ العدّ بالتكرار يعطي الرقم الصحيح.
    expect(estimateSegments('🎂').length).toBe(1);
  });
});

describe('renderCampaignBody', () => {
  it('puts the code on its own line so it can be copied', () => {
    expect(renderCampaignBody('  أهلاً  ', 'CAKE15')).toBe('أهلاً\nرمزك: CAKE15');
  });

  it('leaves the body alone when there is no code', () => {
    expect(renderCampaignBody('أهلاً', null)).toBe('أهلاً');
  });
});

describe('validateCampaign', () => {
  const draft = (partial: Partial<CampaignDraft> = {}): CampaignDraft => ({
    name: 'حملة',
    audience: 'all_consented',
    channel: 'whatsapp',
    body: 'نصّ رسالة كافٍ الطول للاختبار',
    couponCode: null,
    scheduledAt: null,
    ...partial,
  });

  it('passes a sane draft', () => {
    expect(validateCampaign(draft())).toBeNull();
  });

  it('requires a name and a body of substance', () => {
    expect(validateCampaign(draft({ name: '  ' }))).toMatch(/اسم/);
    expect(validateCampaign(draft({ body: 'قصير' }))).toMatch(/قصير/);
  });

  it('rejects a body past the ceiling', () => {
    expect(validateCampaign(draft({ body: 'م'.repeat(MAX_BODY_LENGTH + 1) }))).toMatch(/أطول/);
  });

  it('rejects a schedule outside the send window', () => {
    const at = atRiyadh(2).toISOString();
    expect(validateCampaign(draft({ scheduledAt: at }))).toMatch(/٨ صباحاً/);
  });

  it('accepts a schedule inside the window', () => {
    expect(validateCampaign(draft({ scheduledAt: atRiyadh(11).toISOString() }))).toBeNull();
  });

  it('rejects an unparseable schedule', () => {
    expect(validateCampaign(draft({ scheduledAt: 'ليس تاريخاً' }))).toMatch(/غير صحيح/);
  });
});
