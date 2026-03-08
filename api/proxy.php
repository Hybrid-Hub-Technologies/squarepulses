<?php
// ============================================================
// api/proxy.php — Local Proxy for XAMPP (converted from proxy.js)
// Routes:
//   POST /api/proxy.php               → Binance Square post
//   GET  /api/proxy.php?type=news     → RSS news feeds
//   GET  /api/proxy.php?type=forex    → Forex Factory calendar
//   GET  /api/proxy.php?type=whales   → Whale transactions
//   GET  /api/proxy.php?type=xfeed    → Crypto X/social feed
// ============================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── GET Routes ──────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = $_GET['type'] ?? '';
    $waKey = $_GET['waKey'] ?? '';
    $ethKey = $_GET['ethKey'] ?? '';
    $cpKey = $_GET['cpKey'] ?? '';

    try {
        // ── NEWS ────────────────────────────────────────
        if ($type === 'news') {
            $feeds = [
                ['url' => 'https://www.coindesk.com/arc/outboundfeeds/rss/', 'name' => 'CoinDesk'],
                ['url' => 'https://cointelegraph.com/rss', 'name' => 'CoinTelegraph'],
                ['url' => 'https://decrypt.co/feed', 'name' => 'Decrypt'],
                ['url' => 'https://bitcoinmagazine.com/.rss/full/', 'name' => 'Bitcoin Magazine'],
            ];
            
            $allNews = [];
            foreach ($feeds as $feed) {
                $rssUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' . urlencode($feed['url']) . '&count=12';
                $response = @file_get_contents($rssUrl);
                if (!$response) continue;
                
                $data = json_decode($response, true);
                if (!isset($data['items'])) continue;
                
                foreach ($data['items'] as $i => $item) {
                    $ts = strtotime($item['pubDate'] ?? '') * 1000 ?: 0;
                    $allNews[] = [
                        'id' => $feed['name'] . '-' . $i . '-' . $ts,
                        'title' => trim($item['title'] ?? ''),
                        'description' => substr(strip_tags($item['description'] ?? $item['content'] ?? ''), 0, 220),
                        'source' => $feed['name'],
                        'url' => $item['link'] ?? '#',
                        'image' => $item['thumbnail'] ?? null,
                        'published_at' => $ts ? date('M d, Y H:i A', $ts / 1000) : 'Recent',
                        'tags' => array_slice($item['categories'] ?? [], 0, 3),
                        '_ts' => $ts,
                    ];
                }
            }
            
            // Sort by timestamp
            usort($allNews, function($a, $b) { return $b['_ts'] - $a['_ts']; });
            
            // Dedupe
            $seen = [];
            $allNews = array_filter($allNews, function($n) use (&$seen) {
                $key = substr(strtolower(preg_replace('/\s+/', '', $n['title'])), 0, 50);
                if (in_array($key, $seen)) return false;
                $seen[] = $key;
                return true;
            });
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => array_values($allNews)]);
            exit;
        }

        // ── FOREX ────────────────────────────────────────
        if ($type === 'forex') {
            $response = @file_get_contents('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
            $raw = $response ? json_decode($response, true) : [];
            
            $COUNTRIES = [
                'USD' => '🇺🇸 USA', 'EUR' => '🇪🇺 EUR', 'GBP' => '🇬🇧 UK',
                'JPY' => '🇯🇵 Japan', 'AUD' => '🇦🇺 Australia', 'CAD' => '🇨🇦 Canada',
                'CHF' => '🇨🇭 Switzerland', 'CNY' => '🇨🇳 China', 'INR' => '🇮🇳 India',
            ];
            
            $FLAGS = [
                'USD' => '🇺🇸', 'EUR' => '🇪🇺', 'GBP' => '🇬🇧', 'JPY' => '🇯🇵',
                'AUD' => '🇦🇺', 'CAD' => '🇨🇦', 'CHF' => '🇨🇭', 'CNY' => '🇨🇳',
            ];
            
            $IMAP = [
                'INTEREST RATE' => ['text' => 'Central bank rate decision—critical for crypto and risk assets', 'bullish' => null],
                'INFLATION' => ['text' => 'Report may trigger rate hikes or cuts—affects risk appetite', 'bullish' => null],
                'CPI' => ['text' => 'Consumer inflation data impacts Fed policy and market sentiment', 'bullish' => null],
                'GDP' => ['text' => 'Economic growth data affects confidence and crypto demand', 'bullish' => null],
                'NFP' => ['text' => 'Jobs report drives risk-on/off sentiment, impacts Fed hawkishness', 'bullish' => null],
                'UNEMPLOYMENT' => ['text' => 'Labor market strength affects spending power and crypto adoption', 'bullish' => null],
                'EARNINGS' => ['text' => 'Corporate profit reports impact equity markets and risk appetite', 'bullish' => null],
                'BANKING' => ['text' => 'Financial sector stress affects liquidity and institutional crypto activity', 'bullish' => null],
            ];
            
            $events = [];
            foreach ($raw as $e) {
                if (($e['impact'] ?? '') !== 'High' && ($e['impact'] ?? '') !== 'Medium') continue;
                
                $cur = $e['currency'] ?? 'USD';
                $ci = ['text' => 'Macro event may impact risk assets including crypto', 'bullish' => null];
                
                foreach ($IMAP as $k => $v) {
                    if (stripos($e['title'] ?? '', $k) !== false) {
                        $ci = $v;
                        break;
                    }
                }
                
                $timeStr = '—';
                if (isset($e['date'])) {
                    $ts = strtotime($e['date']);
                    if ($ts) {
                        $timeStr = date('M d H:i', $ts);
                    }
                }
                
                $events[] = [
                    'id' => count($events) + 1,
                    'event' => $e['title'] ?? 'Unknown',
                    'country' => $COUNTRIES[$cur] ?? $cur,
                    'flag' => $FLAGS[$cur] ?? '🌍',
                    'time' => $timeStr,
                    'impact' => ($e['impact'] ?? '') === 'High' ? 'HIGH' : 'MEDIUM',
                    'forecast' => $e['forecast'] ?? 'N/A',
                    'previous' => $e['previous'] ?? 'N/A',
                    'actual' => $e['actual'] ?? null,
                    'cryptoImpact' => $ci['text'],
                    'bullishForCrypto' => $ci['bullish'],
                ];
            }
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => array_slice($events, 0, 12)]);
            exit;
        }

        // ── WHALES ──────────────────────────────────────
        if ($type === 'whales') {
            $WHALE_MIN_USD = 500000;
            $allWhales = [];
            
            // Whale Alert API (if key provided)
            if ($waKey) {
                $since = time() - 3600;
                $waUrl = "https://api.whale-alert.io/v1/transactions?api_key={$waKey}&min_value={$WHALE_MIN_USD}&start={$since}&limit=20";
                $response = @file_get_contents($waUrl);
                
                if ($response) {
                    $waData = json_decode($response, true);
                    foreach ($waData['transactions'] ?? [] as $i => $tx) {
                        $ft = $tx['from']['owner_type'] ?? '';
                        $tt = $tx['to']['owner_type'] ?? '';
                        
                        $txType = 'TRANSFER';
                        if ($tt === 'exchange') $txType = 'EXCHANGE_IN';
                        else if ($ft === 'exchange') $txType = 'EXCHANGE_OUT';
                        else if ($ft === 'mint') $txType = 'MINT';
                        else if ($tt === 'burn') $txType = 'BURN';
                        
                        $impact = $tt === 'exchange' ? 'BEARISH' : ($ft === 'exchange' ? 'BULLISH' : 'NEUTRAL');
                        $coin = strtoupper($tx['symbol'] ?? 'UNKNOWN');
                        
                        $allWhales[] = [
                            'id' => 'wa-' . ($tx['id'] ?? $i),
                            'source' => 'WhaleAlert',
                            'type' => $txType,
                            'coin' => $coin,
                            'amount' => formatNum($tx['amount'] ?? 0) . ' ' . $coin,
                            'usdValue' => '$' . formatNum($tx['amount_usd'] ?? 0),
                            'usdValueRaw' => $tx['amount_usd'] ?? 0,
                            'from' => $tx['from']['owner'] ?? substr($tx['from']['address'] ?? '', 0, 12) . '...',
                            'to' => $tx['to']['owner'] ?? substr($tx['to']['address'] ?? '', 0, 12) . '...',
                            'impact' => $impact,
                            'analysis' => buildWhaleAnalysis($txType, $tx['amount'] ?? 0, $coin, $tx['amount_usd'] ?? 0),
                            'time' => date('c', $tx['timestamp'] ?? time()),
                            'txHash' => substr($tx['hash'] ?? 'wa-' . $tx['id'], 0, 14),
                            'explorerUrl' => $tx['hash'] ? 'https://www.blockchain.com/explorer/transactions/' . $tx['hash'] : '',
                        ];
                    }
                }
            }
            
            // Bitcoin blockchain
            $response = @file_get_contents('https://blockchain.info/unconfirmed-transactions?format=json&limit=20');
            if ($response) {
                $btcData = json_decode($response, true);
                $BTC_PRICE = 97000;
                
                foreach ($btcData['txs'] ?? [] as $i => $tx) {
                    $btcAmt = 0;
                    foreach ($tx['out'] ?? [] as $out) {
                        $btcAmt += $out['value'] ?? 0;
                    }
                    $btcAmt = $btcAmt / 1e8;
                    $usd = $btcAmt * $BTC_PRICE;
                    
                    if ($usd > $WHALE_MIN_USD) {
                        $allWhales[] = [
                            'id' => 'btc-' . substr($tx['hash'] ?? '', 0, 8),
                            'source' => 'Bitcoin',
                            'type' => 'TRANSFER',
                            'coin' => 'BTC',
                            'amount' => number_format($btcAmt, 4) . ' BTC',
                            'usdValue' => '~$' . formatNum($usd),
                            'usdValueRaw' => $usd,
                            'from' => substr($tx['inputs'][0]['prev_out']['addr'] ?? '', 0, 14) . '...',
                            'to' => substr($tx['out'][0]['addr'] ?? '', 0, 14) . '...',
                            'impact' => 'NEUTRAL',
                            'analysis' => buildWhaleAnalysis('TRANSFER', $btcAmt, 'BTC', $usd),
                            'time' => date('c'),
                            'txHash' => substr($tx['hash'] ?? '', 0, 14),
                            'explorerUrl' => $tx['hash'] ? 'https://www.blockchain.com/explorer/transactions/btc/' . $tx['hash'] : '',
                        ];
                    }
                }
            }
            
            // CoinGecko fallback
            if (count($allWhales) < 3) {
                $response = @file_get_contents('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=10&page=1&sparkline=false');
                if ($response) {
                    $coins = json_decode($response, true);
                    foreach ($coins as $i => $c) {
                        $change = $c['price_change_percentage_24h'] ?? 0;
                        $txType = $change > 2 ? 'EXCHANGE_OUT' : ($change < -2 ? 'EXCHANGE_IN' : 'TRANSFER');
                        $impact = $change > 3 ? 'BULLISH' : ($change < -3 ? 'BEARISH' : 'NEUTRAL');
                        
                        $allWhales[] = [
                            'id' => 'cg-' . $c['id'],
                            'source' => 'CoinGecko',
                            'type' => $txType,
                            'coin' => strtoupper($c['symbol']),
                            'amount' => formatNum($c['total_volume'] / ($c['current_price'] ?? 1)) . ' ' . strtoupper($c['symbol']),
                            'usdValue' => '$' . formatNum($c['total_volume']),
                            'usdValueRaw' => $c['total_volume'],
                            'from' => $txType === 'EXCHANGE_OUT' ? 'Exchange Wallets' : 'Whale Wallets',
                            'to' => $txType === 'EXCHANGE_IN' ? 'Exchange' : 'Cold Storage',
                            'impact' => $impact,
                            'analysis' => $c['name'] . ' recorded $' . formatNum($c['total_volume']) . ' in 24h volume.',
                            'time' => date('c'),
                            'txHash' => 'cg-vol-' . $c['id'],
                            'explorerUrl' => 'https://www.coingecko.com/en/coins/' . $c['id'],
                        ];
                    }
                }
            }
            
            if (empty($allWhales)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'No whale data available']);
                exit;
            }
            
            // Sort by USD value
            usort($allWhales, function($a, $b) {
                return ($b['usdValueRaw'] ?? 0) - ($a['usdValueRaw'] ?? 0);
            });
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => array_slice($allWhales, 0, 20)]);
            exit;
        }

        // ── XFEED ───────────────────────────────────────
        if ($type === 'xfeed') {
            $token = $cpKey ? "&auth_token={$cpKey}" : '';
            $allPosts = [];
            $filters = ['hot', 'bullish', 'bearish'];
            
            foreach ($filters as $f) {
                $url = "https://cryptopanic.com/api/v1/posts/?public=true&kind=news&filter={$f}{$token}&limit=10";
                $response = @file_get_contents($url);
                if (!$response) continue;
                
                $data = json_decode($response, true);
                foreach ($data['results'] ?? [] as $p) {
                    $coin = $p['currencies'][0]['code'] ?? 'General';
                    $votes = $p['votes'] ?? [];
                    $bullishVotes = ($votes['positive'] ?? 0) + ($votes['liked'] ?? 0);
                    $bearishVotes = ($votes['negative'] ?? 0) + ($votes['disliked'] ?? 0);
                    $totalVotes = $bullishVotes + $bearishVotes + ($votes['important'] ?? 0) + ($votes['saved'] ?? 0);
                    
                    $marketEffect = $bullishVotes > $bearishVotes ? 'BULLISH' : ($bearishVotes > $bullishVotes ? 'BEARISH' : 'NEUTRAL');
                    $impact = $totalVotes > 20 ? 'HIGH' : ($totalVotes > 5 ? 'MEDIUM' : 'LOW');
                    
                    $source = $p['source']['title'] ?? 'CryptoPanic';
                    $sourceDomain = $p['source']['domain'] ?? '';
                    
                    $authorMap = [
                        'coindesk.com' => ['author' => 'CoinDesk', 'handle' => 'CoinDesk', 'emoji' => '📰'],
                        'cointelegraph.com' => ['author' => 'CoinTelegraph', 'handle' => 'Cointelegraph', 'emoji' => '📡'],
                        'decrypt.co' => ['author' => 'Decrypt Media', 'handle' => 'decryptmedia', 'emoji' => '🔓'],
                    ];
                    
                    $authorInfo = $authorMap[$sourceDomain] ?? [
                        'author' => $source,
                        'handle' => str_replace(' ', '', $source),
                        'emoji' => '🐦'
                    ];
                    
                    $ts = strtotime($p['published_at'] ?? '') * 1000 ?: time() * 1000;
                    $diff = floor((time() * 1000 - $ts) / 60000);
                    
                    if ($diff < 60) $timeStr = $diff . 'm ago';
                    else if ($diff < 1440) $timeStr = floor($diff / 60) . 'h ago';
                    else $timeStr = floor($diff / 1440) . 'd ago';
                    
                    $allPosts[] = [
                        'id' => 'cp-' . $p['id'],
                        'author' => $authorInfo['author'],
                        'handle' => $authorInfo['handle'],
                        'emoji' => $authorInfo['emoji'],
                        'content' => $p['title'],
                        'time' => $timeStr,
                        'impact' => $impact,
                        'marketEffect' => $marketEffect,
                        'coin' => $coin,
                        'votes' => ['bullish' => $bullishVotes, 'bearish' => $bearishVotes, 'total' => $totalVotes],
                        'analysis' => buildXAnalysis($p['title'], $marketEffect, $coin, $bullishVotes, $bearishVotes),
                        'url' => $p['url'] ?? '#',
                        '_ts' => $ts,
                    ];
                }
            }
            
            // Dedupe and sort
            $seen = [];
            $allPosts = array_filter($allPosts, function($p) use (&$seen) {
                $key = substr(strtolower(preg_replace('/\s+/', '', $p['content'])), 0, 50);
                if (in_array($key, $seen)) return false;
                $seen[] = $key;
                return true;
            });
            
            usort($allPosts, function($a, $b) {
                $iOrder = ['HIGH' => 0, 'MEDIUM' => 1, 'LOW' => 2];
                $iDiff = ($iOrder[$a['impact']] ?? 2) - ($iOrder[$b['impact']] ?? 2);
                return $iDiff !== 0 ? $iDiff : ($b['_ts'] - $a['_ts']);
            });
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => array_slice($allPosts, 0, 25)]);
            exit;
        }

        http_response_code(400);
        echo json_encode(['code' => 'ERR', 'message' => 'Unknown type']);
        exit;
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit;
    }
}

// ── POST → Binance Square ────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $apiKey = $body['apiKey'] ?? '';
    $content = $body['content'] ?? '';
    
    if (!$apiKey) {
        http_response_code(400);
        echo json_encode(['code' => 'ERR', 'message' => 'API Key missing']);
        exit;
    }
    
    if (!$content) {
        http_response_code(400);
        echo json_encode(['code' => 'ERR', 'message' => 'Content empty']);
        exit;
    }
    
    try {
        $ch = curl_init('https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-Square-OpenAPI-Key: ' . $apiKey,
                'clienttype: binanceSkill',
            ],
            CURLOPT_POSTFIELDS => json_encode(['bodyTextOnly' => $content]),
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $data = json_decode($response, true);
        http_response_code(200);
        echo json_encode($data);
        exit;
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['code' => 'ERR', 'message' => $e->getMessage()]);
        exit;
    }
}

http_response_code(405);
echo json_encode(['code' => 'ERR', 'message' => 'Method not allowed']);
exit;

// ── Helper Functions ────────────────────────────────────
function formatNum($n) {
    $num = floatval($n) ?: 0;
    if ($num >= 1e9) return number_format($num / 1e9, 2) . 'B';
    if ($num >= 1e6) return number_format($num / 1e6, 2) . 'M';
    if ($num >= 1e3) return number_format($num / 1e3, 2) . 'K';
    return number_format($num, 2);
}

function buildWhaleAnalysis($type, $amount, $coin, $usd) {
    $amt = formatNum($amount);
    $val = formatNum($usd);
    
    if ($type === 'EXCHANGE_IN') return "Large $amount $coin ($val) moved INTO an exchange. Possible distribution—watch for price drop.";
    if ($type === 'EXCHANGE_OUT') return "Large $amount $coin ($val) moved OUT of exchange. Accumulation signal—bullish pressure likely.";
    if ($type === 'MINT') return "New $amount $coin ($val) minted. Could increase supply—potential bearish pressure.";
    if ($type === 'BURN') return "Large $amount $coin ($val) burned. Supply reduction—deflationary & bullish.";
    return "Large $coin movement detected ($val). Monitor price action carefully.";
}

function buildXAnalysis($title, $effect, $coin, $bullish, $bearish) {
    $total = $bullish + $bearish;
    $pct = $total > 0 ? round($bullish / $total * 100) : 50;
    $coinStr = $coin !== 'General' ? '$' . $coin . ' ' : '';
    
    if ($effect === 'BULLISH') return $coinStr . "community sentiment is {$pct}% bullish.";
    if ($effect === 'BEARISH') return $coinStr . "community is cautious with " . (100 - $pct) . "% bearish.";
    return $coinStr . "mixed signals from community.";
}
?>
