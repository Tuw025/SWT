const { test, expect } = require('@playwright/test');
const samples = require('../shared/samples.json');

test('API-HEALTH: backend is available', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok', application: 'Date Time Checker' });
});

for (const sample of samples) {
  test(`API-${sample.id}: ${sample.message}`, async ({ request }) => {
    const response = await request.post('/api/date/check', {
      data: { day: sample.day, month: sample.month, year: sample.year },
    });
    expect(response.status()).toBe(sample.status);
    expect(response.headers()['content-type']).toContain('application/json');
    const body = await response.json();
    expect(body).toMatchObject({ outcome: sample.outcome, message: sample.message });
    if (sample.outcome === 'validation_error') {
      expect(body).toMatchObject({ field: sample.field, isValid: null, normalizedDate: null });
    } else {
      expect(body.isValid).toBe(sample.isValid);
      expect(body.normalizedDate).toBe(sample.normalizedDate);
      expect(body.daysInMonth).toBe(sample.daysInMonth);
      expect(body.isLeapYear).toBe(sample.isLeapYear);
      expect(body.field).toBeNull();
    }
  });
}

const invalidFormats = ['', 'abc', '1.5', '1e1', '1 0', '+', '١'];
for (const [field, label] of [['day', 'Day'], ['month', 'Month'], ['year', 'Year']]) {
  for (const value of invalidFormats) {
    test(`API-FORMAT: ${label}=${JSON.stringify(value)}`, async ({ request }) => {
      const data = { day: '1', month: '1', year: '2024', [field]: value };
      const response = await request.post('/api/date/check', { data });
      expect(response.status()).toBe(422);
      expect(await response.json()).toMatchObject({
        outcome: 'validation_error', field: label,
        message: `Input data for ${label} is incorrect format!`,
      });
    });
  }
}

const boundaries = [
  ['day', 'Day', '-1'], ['day', 'Day', '0'], ['day', 'Day', '32'],
  ['month', 'Month', '0'], ['month', 'Month', '13'],
  ['year', 'Year', '999'], ['year', 'Year', '3001'],
  ['year', 'Year', '99999999999999999999'],
];
for (const [field, label, value] of boundaries) {
  test(`API-RANGE: ${label}=${value}`, async ({ request }) => {
    const response = await request.post('/api/date/check', {
      data: { day: '1', month: '1', year: '2024', [field]: value },
    });
    expect(response.status()).toBe(422);
    expect(await response.json()).toMatchObject({
      field: label, message: `Input data for ${label} is out of range!`,
    });
  });
}

test('API-ORDER: report the first error in Day, Month, Year order', async ({ request }) => {
  for (const [data, field] of [
    [{ day: 'abc', month: 'abc', year: 'abc' }, 'Day'],
    [{ day: '1', month: 'abc', year: 'abc' }, 'Month'],
    [{ day: '1', month: '1', year: 'abc' }, 'Year'],
  ]) {
    const response = await request.post('/api/date/check', { data });
    expect(response.status()).toBe(422);
    expect((await response.json()).field).toBe(field);
  }
});

test('API-NORMALIZE: accept whitespace, leading zeroes and an integer sign', async ({ request }) => {
  const response = await request.post('/api/date/check', {
    data: { day: ' 01 ', month: '+02', year: '002024' },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ isValid: true, normalizedDate: '01/02/2024' });
});

for (const body of ['{', 'null', '[]', '{"day":1,"month":"1","year":"2024"}']) {
  test(`API-REQUEST: reject malformed structure ${body}`, async ({ request }) => {
    const response = await request.post('/api/date/check', {
      data: body, headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).outcome).toBe('request_error');
  });
}

test('API-MEDIA: reject a non-JSON content type', async ({ request }) => {
  const response = await request.post('/api/date/check', {
    data: '{}', headers: { 'Content-Type': 'text/plain' },
  });
  expect(response.status()).toBe(415);
});

test('API-MISSING: a missing field is a format error', async ({ request }) => {
  const response = await request.post('/api/date/check', { data: { month: '1', year: '2024' } });
  expect(response.status()).toBe(422);
  expect(await response.json()).toMatchObject({ field: 'Day', message: 'Input data for Day is incorrect format!' });
});
