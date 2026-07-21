import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { syncMarketingOptIn, toE164 } from './klaviyo';

type MockRes = Partial<Response> & { status: number };

const okCreate: MockRes = { status: 201, ok: true, json: async () => ({}), text: async () => '' };
const okSubscribe: MockRes = { status: 202, ok: true, json: async () => ({}), text: async () => '' };

function mockFetch(responses: MockRes[]) {
  const fn = vi.fn();
  responses.forEach((r) => fn.mockResolvedValueOnce(r));
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('toE164', () => {
  it('keeps a valid E.164 number', () => expect(toE164('+15005550006')).toBe('+15005550006'));
  it('formats a 10-digit US number', () => expect(toE164('(500) 555-0006')).toBe('+15005550006'));
  it('formats an 11-digit US number', () => expect(toE164('1 500 555 0006')).toBe('+15005550006'));
  it('drops an unparseable number', () => expect(toE164('12345')).toBeNull());
  it('handles null/empty', () => {
    expect(toE164('')).toBeNull();
    expect(toE164(null)).toBeNull();
  });
});

describe('syncMarketingOptIn', () => {
  const original = process.env.KLAVIYO_API_KEY;

  beforeEach(() => {
    process.env.KLAVIYO_API_KEY = 'pk_test';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    process.env.KLAVIYO_API_KEY = original;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('upserts profile with opt-in + referral properties, then subscribes to email', async () => {
    const fetchMock = mockFetch([okCreate, okSubscribe]);
    await syncMarketingOptIn({
      email: 'a@b.com',
      firstName: 'Al',
      lastName: 'Rivera',
      phone: '(500) 555-0006',
      referralSource: 'American Red Cross Donation',
      emailConsent: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [createUrl, createInit] = fetchMock.mock.calls[0];
    expect(createUrl).toBe('https://a.klaviyo.com/api/profiles');
    expect(createInit.headers.Authorization).toBe('Klaviyo-API-Key pk_test');
    const createBody = JSON.parse(createInit.body);
    expect(createBody.data.attributes.email).toBe('a@b.com');
    expect(createBody.data.attributes.phone_number).toBe('+15005550006');
    expect(createBody.data.attributes.properties['Habit Tracker Opt-In']).toBe(true);
    expect(createBody.data.attributes.properties['Referral Source']).toBe('American Red Cross Donation');

    const subBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs',
    );
    expect(subBody.data.relationships.list.data.id).toBe('WnZs4Z');
    const subAttrs = subBody.data.attributes.profiles.data[0].attributes;
    expect(subAttrs.subscriptions.email.marketing.consent).toBe('SUBSCRIBED');
    expect(subAttrs.subscriptions.sms).toBeUndefined();
    expect(subBody.data.attributes.custom_source).toBe('30-Day Habit Tracker');
  });

  it('subscribes to SMS with the phone on the same profile when SMS consent is given', async () => {
    const fetchMock = mockFetch([okCreate, okSubscribe]);
    await syncMarketingOptIn({
      email: 'a@b.com',
      phone: '(500) 555-0006',
      emailConsent: true,
      smsConsent: true,
    });

    const subAttrs = JSON.parse(fetchMock.mock.calls[1][1].body).data.attributes.profiles.data[0]
      .attributes;
    expect(subAttrs.phone_number).toBe('+15005550006');
    expect(subAttrs.subscriptions.email.marketing.consent).toBe('SUBSCRIBED');
    expect(subAttrs.subscriptions.sms.marketing.consent).toBe('SUBSCRIBED');
  });

  it('omits an unformattable phone from the profile', async () => {
    const fetchMock = mockFetch([okCreate, okSubscribe]);
    await syncMarketingOptIn({ email: 'a@b.com', phone: 'call me', emailConsent: true });
    const createBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(createBody.data.attributes.phone_number).toBeUndefined();
  });

  it('does not set SMS consent when the phone cannot be formatted', async () => {
    const fetchMock = mockFetch([okCreate]);
    await syncMarketingOptIn({ email: 'a@b.com', phone: 'call me', smsConsent: true });
    // Upsert runs; subscribe has no valid channel (no email, no valid SMS phone) -> no 2nd call.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('patches the existing profile on a 409, then still subscribes', async () => {
    const conflict: MockRes = {
      status: 409,
      ok: false,
      json: async () => ({ errors: [{ meta: { duplicate_profile_id: 'PROF123' } }] }),
      text: async () => '',
    };
    const okPatch: MockRes = { status: 200, ok: true, json: async () => ({}), text: async () => '' };
    const fetchMock = mockFetch([conflict, okPatch, okSubscribe]);

    await syncMarketingOptIn({ email: 'a@b.com', emailConsent: true });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('https://a.klaviyo.com/api/profiles/PROF123');
    expect(fetchMock.mock.calls[1][1].method).toBe('PATCH');
  });

  it('makes no calls when neither email nor SMS consent is given', async () => {
    const fetchMock = mockFetch([]);
    await syncMarketingOptIn({ email: 'a@b.com', phone: '+15005550006' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never throws and makes no calls when the API key is missing', async () => {
    delete process.env.KLAVIYO_API_KEY;
    const fetchMock = mockFetch([]);
    await expect(syncMarketingOptIn({ email: 'a@b.com', emailConsent: true })).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('still subscribes even if the profile upsert fails', async () => {
    const fail: MockRes = { status: 500, ok: false, json: async () => ({}), text: async () => 'err' };
    const fetchMock = mockFetch([fail, okSubscribe]);
    await syncMarketingOptIn({ email: 'a@b.com', emailConsent: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs',
    );
  });
});
