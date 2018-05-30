use Cro::HTTP::Router;
use JSON::Fast;
use Digest::MD5;

use Token;

my $md5 = Digest::MD5.new;

sub log($s) {
    spurt 'log.txt', $s~"\n", :append
}

sub md5(Str $s) {
    $md5.md5_hex($s)
}

sub myRand {
    1e4.rand.Str
}

constant JSON_DATA = 'data.json';
constant TIME_OUT_LOGIN = 3600;
constant TIME_OUT_TIME = 5;
my %UP = (
    'admin' => 'bjsdxb',
);

spurt JSON_DATA, '{}' unless JSON_DATA.IO ~~ :f;
my %data = from-json JSON_DATA.IO.slurp;
my $tokens = Tokens.new;

sub writeData {
    spurt JSON_DATA, to-json %data;
}

sub newToken {
    my $t = $tokens.getToken(%data);
    writeData;
    $t
}

my $time = -1;
my $ran = '';
my $h1 = '';

sub routes() is export {
    route {
        get -> {
            content 'text/html', "<h1> hello </h1>";
        }

        get -> 'api', 'login' {
            content 'text/plain', newToken
        }

        post -> 'api', $type {
            given $type {
                when 'login' {
                    request-body 'application/json' => -> %json {
                        # keys: usr, time_token, hash
                        if $tokens.isValid(%json<time_token>, TIME_OUT_TIME) {
                            if md5(%UP{ %json<usr> } ~ %json<time_token>) eq %json<hash> {
                                content 'text/plain', newToken;
                            }
                            else {
                                response.status = 400;
                            }
                        }
                        else {
                            response.status = 408;
                        }
                    };
                }

                default {
                   response.status = 404;
                }
            }
        }
    }
}
