// services/scraper.ts
import puppeteer from 'puppeteer';

export class WebScraperService {
  
  async scrapeTextFromPage(url: string): Promise<string> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
    );

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Extract all visible text on the page
      const bodyText = await page.evaluate(() => {
        return document.body.innerText;
      });

      await browser.close();
      return bodyText || 'No text content found';
    } catch (err) {
      await browser.close();
      console.error(`Failed to scrape ${url}:`, err);
      return 'Error scraping page';
    }
  }
}
