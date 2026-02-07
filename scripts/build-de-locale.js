const fs = require('fs');
const path = require('path');
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/en.json'), 'utf8'));

const de = {
  welcome: { title: 'Willkommen bei Fortune Trader', disclaimer: 'Dies ist ein <strong>Börsenhandel-Simulator</strong> in einer Welt, in der Wahrsagekekse die Zukunft vorhersagen. Alle Gelder und Trades sind fiktiv. Bitte setzen Sie kein echtes Geld ein.', ok: 'Okay' },
  login: { title: 'Bäcker-Bank', subtitle: 'Anmeldedaten eingeben', cardLogo: 'Bäcker-Bank', cardHolder: 'KARTENINHABER', yourName: 'IHR NAME', expires: 'GÜLTIG BIS', continue: 'Weiter', authorizedSignature: 'AUTORISIERTE UNTERSCHRIFT', securityCode: 'SICHERHEITSCODE', back: 'Zurück', login: 'Anmelden', hint: 'Keine echten Bankdaten' },
  apps: { fortuneTrader: 'Fortune Trader', bakersBank: 'Bäcker-Bank', shop: 'Shop', expenses: 'Ausgaben', whales: 'Wale', settings: 'Einstellungen' },
  sync: { title: 'Synchronisiere...', message: 'Sichere deine Session in der Cloud', status: 'Bitte warten...' },
  banker: { title: 'Bäcker-Bank', balanceLabel: 'Kontostand', lifetimeEarnings: 'Gesamtverdienst', lifetimeSpendings: 'Gesamtausgaben', earningsPanelHeader: 'Handelsrunden-Verlauf', spendingPanelHeader: 'Ausgabenverlauf', deposit: 'Einzahlen', loans: 'Kredite', depositToTrading: 'Auf Handelskonto', all: 'Alle', amount: 'Betrag', depositBtn: 'Einzahlen', tradingAccount: 'Handelskonto', feeHint: '5% Gebühr bei Auszahlung', loanSectionTitle: 'Kredit', noRoundsYet: 'Noch keine Runden ausgezahlt.', noSpendingsYet: 'Noch keine Ausgaben.', term: 'Laufzeit', interestRate: 'Zinssatz', todaysRate: 'Heutiger Satz (fix bei Kredit)', loanAmount: 'Kreditsumme', basedOnEarnings: 'Basierend auf Gesamtverdienst', alreadyHaveLoanBtn: 'Kredit bereits vorhanden', noEarningsYet: 'Noch kein Verdienst', takeLoan: 'Kredit aufnehmen', loanUnavailableEarnings: 'Unverfügbar – Du brauchst Gesamtverdienst für einen Kredit', loanUnavailableActive: 'Unverfügbar – Du hast bereits einen aktiven Kredit', principal: 'Betrag', rate: 'Satz', termWeeks: 'Wochen', dueDate: 'Fällig am', payoffToday: 'Heute zurückzahlen', daysRemaining: 'Tage übrig', overdueBy: 'Überfällig seit', fullTermPayoff: 'Rückzahlung bis Laufzeitende', repayNow: 'Jetzt zurückzahlen', loanActive: 'ist aktiv.', roundLabel: 'Runde {{n}}', tradingRound: 'Handelsrunde', depositLabel: 'Einzahlung', cashoutLabel: 'Auszahlung', feeLabel: 'Gebühr' },
  locked: { text: 'Keine Handelsmittel', hint: 'Zuerst von der Bäcker-Bank einzahlen', openBanker: 'Bank öffnen' },
  expenses: { title: 'Ausgaben', dailyLabel: 'Tägliche Ausgaben', chargedPerDay: 'Einmal pro Tag', nextCharge: 'Nächste Abbuchung Mitternacht', warning: 'Lifestyle mit +/- anpassen. Minima angezeigt. Täglich um Mitternacht!', rent: { name: 'Miete', description: 'Monatliche Miete' }, utilities: { name: 'Nebenkosten', description: 'Strom, Wasser, Gas' }, groceries: { name: 'Lebensmittel', description: 'Essen und Grundbedarf' }, transport: { name: 'Transport', description: 'Benzin, ÖPNV, Parken' }, phone: { name: 'Telefon', description: 'Mobilfunk' }, internet: { name: 'Internet', description: 'Heim-Internet' }, insurance: { name: 'Versicherung', description: 'Kranken- und Lebensversicherung' }, subscriptions: { name: 'Abos', description: 'Streaming, Apps usw.' }, eliminated: '✅ Entfallen!', daysExpenses: '{{days}} Tage Ausgaben: -${{amount}}', dailyExpensesNotif: 'Tägliche Ausgaben: -${{amount}}' },
  shop: { title: 'Shop', estate: 'Immobilien', cars: 'Autos', luxury: 'Luxus', yourAssets: 'Deine Vermögenswerte', hint: 'Immobilien und Autos entfallen tägliche Ausgaben. Luxus nur zur Schau!', buy: 'Kaufen', owned: 'Besitz', sell: 'Verkaufen', micro_flat: { name: 'Stadt-Mikrowohnung', description: 'Kleine Eigentumswohnung. Entfällt Miete.' }, new_build_flat: { name: 'Neubau-Wohnung', description: 'Moderne Wohnung. Entfällt Miete.' }, family_house: { name: 'Einfamilienhaus', description: 'Haus mit Garten. Entfällt Miete.' }, villa_estate: { name: 'Villa', description: 'Hochwertige Villa. Entfällt Miete.' }, compact_used: { name: 'Gebrauchter Kleinwagen', description: 'Einfaches Auto. Entfällt Transport.' }, performance_car: { name: 'Sportcoupé', description: 'Schnell und laut. Entfällt Transport.' }, executive_vehicle: { name: 'Oberklasse-Fahrzeug', description: 'Komfort und Status. Entfällt Transport.' }, exotic_supercar: { name: 'Exotischer Supercar', description: 'Extreme Leistung. Entfällt Transport.' }, mechanical_watch: { name: 'Mechanische Uhr', description: 'Luxus-Chronometer.' }, fine_jewelry: { name: 'Schmuck-Set', description: 'Edelmetalle und Steine.' }, tailored_wardrobe: { name: 'Maßgarderobe', description: 'Individuelle Kleidung.' }, original_art: { name: 'Original-Kunstwerk', description: 'Werk eines anerkannten Künstlers.' }, motor_yacht: { name: 'Motoryacht (25m)', description: 'Private Yacht.' }, private_jet: { name: 'Privatjet (Leichtklasse)', description: 'Privates Fliegen.' } },
  settings: { title: 'Einstellungen', account: 'Konto', loggedInAs: 'Angemeldet als', logOut: 'Abmelden', logOutDesc: 'Gespeicherte Anmeldedaten löschen', gameData: 'Spieldaten', resetGame: 'Spiel zurücksetzen', resetGameDesc: 'Alle Daten löschen und neu starten', audio: 'Audio', volume: 'Lautstärke', about: 'Über', version: 'Version', creator: 'Autor', language: 'Sprache' },
  leaderboard: { title: 'Beste Händler', subtitle: 'Top der Saison', loading: 'Laden...', offline: 'Bestenliste offline.', loadError: 'Laden fehlgeschlagen: {{error}}', noPlayers: 'Noch keine Spieler.', updated: 'Aktualisiert {{date}}', failed: 'Fehler: {{error}}', wealth: 'Vermögen', earnings: 'Verdienst' },
  phoneHint: 'ESC zum Öffnen/Schließen des Handys',
  openPhone: 'Handy öffnen',
  nav: { fortuneTrader: 'Fortune Trader', live: 'LIVE', streak: 'Serie', bet: 'Einsatz', next: 'Weiter', cash: 'Guthaben', tutorial: 'Tutorial', portfolio: 'Portfolio', cashOut: 'Auszahlen' },
  chart: { live: 'Live', loading: 'Lade Marktdaten...', '1h': '1h', '1d': '1T', '1w': '1W', '1m': '1M', '1y': '1J', long: 'Long', short: 'Short', buyStock: 'Aktien kaufen', sellAllStock: 'Alle verkaufen', longMargin: 'Long mit Hebel', shortMargin: 'Short mit Hebel', closePosition: 'Position schließen', positionLocked: 'Position gesperrt' },
  cookie: { cookieShop: 'Keks-Shop', news: 'News', console: 'Konsole', fortuneCookie: 'Wahrsagekeks', fortuneCookieAlt: 'Wahrsagekeks', basicProphecy: 'Basis-Prophezeiung', shopLabel: 'Shop', stash: 'Keks-Vorrat', cookiesCount: '{{count}} Kekse', noCookies: 'Noch keine Kekse. Oben kaufen!', dragCookie: 'Keks hierher ziehen, um die Prophezeiung zu öffnen', cookieCountOne: '{{count}} Keks', cookieCountMany: '{{count}} Kekse', clickToUnwrap: 'Klick zum Entpacken ({{current}}/5)', addedToStash: '{{name}} zum Vorrat', cookieReadyToUnpack: 'Keks bereit zum Öffnen!', prophecyDecoded: 'Prophezeiung entschlüsselt!', prophecyExpired: 'Prophezeiung für {{stock}} abgelaufen', pleaseWaitBet: 'Bitte {{s}}s warten vor nächstem Einsatz', pleaseWaitBuy: 'Bitte {{s}}s warten vor nächstem Kauf', pleaseWaitTrade: 'Bitte {{s}}s warten vor nächstem Trade', insufficientFunds: 'Nicht genug Guthaben', predictionPlaced: 'Vorhersage bei ${{price}}', positionOpened: '{{dir}}-Position eröffnet', predictionWon: 'Gewonnen! +${{amount}} 🔥', predictionLost: 'Verloren -${{amount}}', stockUnlockRequired: 'Upgrade "Aktienhandel" kaufen', marginUnlockRequired: 'Upgrade "Margin-Handel" kaufen', closeMarginFirst: 'Schließe zuerst deine Margin-Position', positionLockedMsg: 'Position noch gesperrt. Timer abwarten.', insufficientFundsFee: 'Nicht genug (benötigt ${{total}} inkl. ${{fee}} Gebühr)', boughtShares: '{{shares}} Aktien @ ${{price}} (Gebühr: ${{fee}})', noSharesToSell: 'Keine Aktien zum Verkaufen', soldSharesProfit: '{{shares}} Aktien verkauft +${{pnl}}', soldSharesLoss: '{{shares}} Aktien verkauft -${{pnl}}', noStocksToSell: 'Keine Aktien zum Verkaufen', failedToSell: 'Verkauf fehlgeschlagen', soldAllCount: '{{count}} Aktie verkauft', soldAllCountPlural: '{{count}} Aktien verkauft', noProfitableStocks: 'Keine gewinnbringenden Aktien', soldProfitableCount: '{{count}} gewinnbringende Aktie verkauft', soldProfitableCountPlural: '{{count}} gewinnbringende Aktien verkauft', marginPositionOpened: '{{dir}}-Margin eröffnet (x{{mult}})', marginClosedProfit: 'Margin geschlossen! +${{pnl}} 🔥', marginClosedLoss: 'Margin geschlossen. -${{pnl}}', marginCall: 'Margin-Call! Position geschlossen. Kontostand: $0' },
  news: { title: 'Marktnews', articlesCount: '{{count}} Artikel', empty: 'Noch keine News.', tabUnlockRequired: 'Upgrade "News-Tab" kaufen', consoleUnlockRequired: 'Upgrade "Konsole" kaufen', hintTitle: 'Mehr freischalten', hintText: 'News-Upgrades im Keks-Shop kaufen' },
  bots: { consoleTitle: 'SYSTEMKONSOLE v1.0', ready: 'BEREIT', welcome1: 'Fortune Trader Konsole', welcome2: "'help' für Befehle", placeholder: 'Befehl eingeben...', selectStrategy: 'Bitte Strategie wählen', alreadyExists: '{{name}} existiert bereits. Nur ein Bot pro Strategie.', botCreated: 'Bot "{{name}}" erstellt!', botEnabled: '{{name}} aktiviert', botDisabled: '{{name}} deaktiviert', botDeleted: 'Bot "{{name}}" gelöscht', disable: 'Deaktivieren', enable: 'Aktivieren', deleteBot: 'Bot löschen' },
  deals: { title: 'Aktive Prophezeiungen', activeCount: '{{count}} aktiv', empty: 'Keine aktiven Prophezeiungen. Kaufe einen Wahrsagekeks.', detailStrength: 'Stärke:', detailFloor: 'Boden:', detailCeiling: 'Decke:', detailZone: 'Zone:', zoneTouched: 'Zone erreicht!', detailVol: 'Vol.:' },
  portfolio: { title: 'Portfolio', portfolioValue: 'Portfoliowert', cashOutFee: 'Auszahlgebühr (5%)', netProfit: 'Netto Gewinn/Verlust', youReceive: 'Du erhältst', cash: 'Guthaben', stockHoldings: 'Aktien', totalPortfolio: 'Gesamtportfolio', totalPnL: 'Gesamt P&L', sendAllStock: 'Alle verkaufen', emptyText: 'Noch keine Aktien', emptyHint: 'Kaufe Aktien – sie erscheinen hier', colStock: 'Aktie', colShares: 'Stück', colAvgPrice: 'Ø Preis', colCurrent: 'Aktuell', colValue: 'Wert', colPnL: 'P&L' },
  modals: { resetTitle: 'Spiel zurücksetzen?', resetText: 'Kontostand wird $1.000. <strong>Alle gespeicherten Daten</strong> werden gelöscht. Unwiderruflich.', cancel: 'Abbrechen', resetDelete: 'Zurücksetzen & Alles löschen', gameOverTitle: 'Game Over', gameOverMessage: 'Weniger als $50 auf Konto und Handelskonto. {{reason}} Deine Reise ist zu Ende.', gameOverReasonLoan: 'Du hast bereits einen Kredit.', gameOverReasonNoEarnings: 'Kein Gesamtverdienst – kein Kredit möglich.', gameOverReasonNone: 'Keine Kredite verfügbar.', gameOverQuestion: 'Neu starten?', restartGame: 'Neu starten', prestigeTitle: 'Auszahlen?', prestigeText: 'Portfolio auf Bank übertragen und neue Runde.', prestigePortfolioValue: 'Portfoliowert', prestigeFee: 'Gebühr (5%)', prestigeNetProfit: 'Netto Gewinn/Verlust', prestigeYouReceive: 'Du erhältst', cashOutBtn: 'Auszahlen', tutorialTitle: 'Trading-Grundlagen', previous: 'Zurück', next: 'Weiter', finish: 'Fertig' },
  streamer: { live: 'LIVE', watching: '{{count}} Zuschauer' },
  notifications: { wrongPassword: 'Falsches Passwort.', alreadyHaveLoan: 'Du hast bereits einen Kredit.', loanNotConfigured: 'Kreditsystem nicht konfiguriert.', needEarningsForLoan: 'Du brauchst Gesamtverdienst für einen Kredit.', loanApproved: 'Kredit ${{amount}} zu {{rate}}% pro Woche!', insufficientRepay: 'Nicht genug Guthaben zur Rückzahlung.', loanRepaid: 'Kredit ${{amount}} zurückgezahlt.', loanAutoRepaid: 'Kredit automatisch zurückgezahlt: ${{amount}}.', insufficientFunds: 'Nicht genug Guthaben!', itemNotFound: 'Artikel nicht gefunden!', noFundsToCashOut: 'Nichts zum Auszahlen', depositSuccess: 'Einzahlung erfolgreich.', depositError: 'Einzahlung fehlgeschlagen.', purchaseSuccess: 'Kauf erfolgreich!', sellSuccess: 'Verkauft.' },
  loan: { name: 'Kredit', description: 'Kreditsumme basiert auf Gesamtverdienst' },
  upgrades: {
    cookieDiscount: { name: 'Keks-Rabatt I', description: '10% Rabatt auf Wahrsagekekse' },
    cookieDiscount2: { name: 'Keks-Rabatt II', description: '25% Rabatt' },
    cookieDiscount3: { name: 'Keks-Rabatt III', description: '50% Rabatt' },
    autoReveal: { name: 'Auto-Entschlüsselung I', description: '1 Buchstabe pro Tick' },
    autoReveal2: { name: 'Auto-Entschlüsselung II', description: '2 Buchstaben pro Tick' },
    autoReveal3: { name: 'Auto-Entschlüsselung III', description: '4 Buchstaben pro Tick' },
    betCombo1: { name: 'Einsatz-Kombo I', description: 'Höhere Einsätze' },
    betCombo2: { name: 'Einsatz-Kombo II', description: 'Noch höhere Einsätze' },
    betCombo3: { name: 'Einsatz-Kombo III', description: 'Maximale Einsätze' },
    predictionZone1: { name: 'Prophezeiungs-Zone I', description: 'Größere Zone beim Einsatz' },
    predictionZone2: { name: 'Prophezeiungs-Zone II', description: 'Noch größere Zone' },
    goldenCookie: { name: 'Goldener Keks', description: 'Präzisere Prophezeiungen' },
    diamondCookie: { name: 'Seltener Keks', description: 'Sehr präzise Prophezeiungen' },
    newsAccess1: { name: 'News-Zugang I', description: '25% der Artikel' },
    newsAccess2: { name: 'News-Zugang II', description: '50% der Artikel' },
    newsAccess3: { name: 'News-Zugang III', description: '100% der Artikel' },
    stockTradingUnlock: { name: 'Aktienhandel', description: 'Aktien kaufen und verkaufen' },
    marginTradingUnlock: { name: 'Margin-Handel', description: 'Hebel-Handel (x25)' },
    marginMultiplier1: { name: 'Margin-Multiplikator I', description: 'Bis 30x' },
    marginMultiplier2: { name: 'Margin-Multiplikator II', description: 'Bis 40x' },
    marginMultiplier3: { name: 'Margin-Multiplikator III', description: 'Bis 55x' },
    newsTabUnlock: { name: 'News-Tab', description: 'News-Tab freischalten' },
    consoleTabUnlock: { name: 'Konsole-Tab', description: 'Konsole freischalten' },
    botBetTier1: { name: 'Bot-Einsatz I', description: 'Bots nutzen 25% deines Einsatzes' },
    botBetTier2: { name: 'Bot-Einsatz II', description: 'Bots nutzen 50%' },
    botBetTier3: { name: 'Bot-Einsatz III', description: 'Bots nutzen 100%' },
    cookieStockHint: { name: 'Keks-Aktien-Hinweis', description: 'Zeigt Aktien-Hinweis auf Keks' },
    cookieProphecyHint: { name: 'Keks-Prophezeiungs-Hinweis', description: 'Zeigt Typ-Hinweis auf Keks' }
  },
  cookieTiers: { '1': { name: 'Wahrsagekeks', description: 'Basis-Prophezeiung' }, '2': { name: 'Goldener Keks', description: 'Bessere Prophezeiung' }, '3': { name: 'Seltener Keks', description: 'Premium-Prophezeiung' } },
  prophecy: { trendUp: { name: 'Aufwärtstrend', description: 'Aufwärtstrend erkannt' }, trendDown: { name: 'Abwärtstrend', description: 'Abwärtstrend erkannt' }, shore: { name: 'Ufer', description: 'Preisober- und -untergrenze' }, inevitableZone: { name: 'Unvermeidliche Zone', description: 'Preis erreicht diese Zone' }, volatilitySpike: { name: 'Volatilitätsspitze', description: 'Hohe Volatilität' }, volatilityCalm: { name: 'Volatilitätsruhe', description: 'Niedrige Volatilität' } },
  stocks: en.stocks,
  newsTemplates: {
    trendUp: [
      '{{stock}} mit starkem Aufwärtstrend – Investoren zeigen Zuversicht',
      'Analysten sehen bullische Signale in den {{stock}}-Kursmustern',
      '{{stock}} gewinnt an Fahrt bei positiver Marktstimmung',
      'Eilmeldung: {{stock}} mit deutlicher Kurssteigerung',
      'Investoren strömen zu {{stock}} bei positivem Marktausblick'
    ],
    trendDown: [
      '{{stock}} unter Verkaufsdruck – Stimmung am Markt kippt',
      'Analysten sehen bärische Signale bei {{stock}}',
      '{{stock}} verliert angesichts der Marktunsicherheit',
      'Eilmeldung: {{stock}} mit deutlichem Kursrückgang',
      'Investoren bleiben bei {{stock}} vorsichtig'
    ],
    volatility: [
      'Hohe Volatilität in der {{stock}}-Handelssitzung',
      '{{stock}} mit erhöhter Marktvolatilität',
      'Marktunsicherheit treibt {{stock}}-Kursschwankungen',
      'Händler bereiten sich auf Volatilität bei {{stock}} vor',
      '{{stock}} mit starkem Handelsvolumen und Kurssprüngen'
    ],
    general: [
      'Marktanalysten legen neuen Bericht zu {{stock}} vor',
      'Handelsvolumen von {{stock}} deutlich gestiegen',
      'Eilmeldung: Wichtige Entwicklung beeinflusst {{stock}}',
      '{{stock}} zeigt heute interessante Kursbewegungen',
      'Marktbeobachter verfolgen {{stock}} aufmerksam'
    ]
  },
  tutorial: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/tutorial-de.json'), 'utf8')),
  common: { versionLabel: 'Version {{version}}', max: 'MAX!' },
  ui: { upgradeRequiredFirst: 'Kaufe zuerst "{{name}}"', insufficientFunds: 'Nicht genug Guthaben', stockTradingUnlocked: 'Aktienhandel freigeschaltet!', marginTradingUnlocked: 'Margin-Handel freigeschaltet!', marginMultiplierIncreased: 'Margin-Multiplikator x{{mult}}!', newsTabUnlocked: 'News-Tab freigeschaltet!', consoleTabUnlocked: 'Konsole freigeschaltet!', botBetIncreased: 'Bot-Einsatz auf {{pct}}%!', upgradePurchased: '{{name}} gekauft!', unknownUpgrade: 'Unbekanntes Upgrade', alreadyPurchased: 'Bereits gekauft!', sendProfitableStock: 'Alle gewinnbringenden verkaufen', sendProfitableStockCount: 'Alle gewinnbringenden ({{count}}) verkaufen', resettingGame: 'Spiel wird zurückgesetzt...', gameResetComplete: 'Zurücksetzen abgeschlossen.', noStocksToSell: 'Keine Aktien zum Verkaufen', sellAllStocks: 'Alle verkaufen', showStream: 'Stream anzeigen', hideStream: 'Stream ausblenden', unlockStockTrading: 'Upgrade "Aktienhandel" kaufen', unlockMarginTrading: 'Upgrade "Margin-Handel" kaufen', closeMarginFirst: 'Schließe zuerst deine Margin-Position' }
};

fs.writeFileSync(path.join(__dirname, '../locales/de.json'), JSON.stringify(de, null, 2), 'utf8');
console.log('locales/de.json created');
