use Cro::HTTP::Router;
use JSON::Fast;
use Digest::MD5;

use Token;
use DataBase;

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

constant FRONT = '../front_end';

constant JSON_DATA = 'data.json';
constant USR_DATA= 'user.json';
constant TIME_OUT_LOGIN = 3600;
constant TIME_OUT_TIME = 5;
my %UP = from-json USR_DATA.IO.slurp;

spurt JSON_DATA, '{}' unless JSON_DATA.IO ~~ :f;
my $data = ServerData.new(json_file => JSON_DATA);
my $logTokens = Tokens.new(time_out => TIME_OUT_LOGIN);
my $timeTokens = Tokens.new(time_out => TIME_OUT_TIME);


sub save is export {
    $data.save(JSON_DATA);
}

sub getToken($tokens) {
    my $t = $tokens.getToken($data.tokenId);
    $data.incTokenId;
    $t
}

sub newLogToken {
    getToken($logTokens);
}

sub newTimeTOken {
    getToken($timeTokens);
}

my $time = -1;
my $ran = '';
my $h1 = '';

sub refresh() is export {
    $timeTokens.deleteOldToken;
    $logTokens.deleteOldToken;
}

sub routes() is export {
    route {
        get -> {
            static FRONT ~ '/html/index.html'
        }

        get -> 'js', *@path {
            static FRONT ~ '/js', @path
        }

        get -> 'css', *@path {
            static FRONT ~ '/css', @path
        }

        get -> 'img', *@path {
            static FRONT ~ '/other', @path
        }

        get -> 'test' {
            content 'text/plain', to-json $data.getPoints
        }

        get -> 'api', $type, :%headers is header {
            if $type ∉ <login points> and !$logTokens.isValid(%headers<token>) {
                forbidden
            }
            else {
                given $type {
                    when 'login'  { content 'text/plain', newTimeTOken }
                    when 'points' {
                        content 'application/json', to-json $data.getPoints;
                    }
                    default       { response.status = 404 }
                }
            }
        }

        put -> 'api', 'points' {
            request-body 'application/json' => -> %json = {} {
                # { token : xxx, point : xxx, name : xxx, method : add | set | delete } }
                if    ! (%json<token>.defined
                          and %json<point>.defined
                          and %json<method>.defined)        { bad-request }
                elsif ! $logTokens.isValid(%json<token>)    { forbidden   }
                else {
                    my $p = parsePoint(%json<point>);
                    if ! $p {
                        bad-request
                    }
                    else {
                        if %json<method> ∈ <add set>
                          and ! %json<name>.defined {
                            bad-request
                        }
                        else {
                            given %json<method> {
                                when 'add' {
                                    if $data.pointExists($p) {
                                        content 'text/plain', 'exists'
                                    }
                                    else {
                                        $data.setPoint($p, %json<name>);
                                        content 'text/plain', 'ok'
                                    }

                                }
                                when 'set' {
                                    if !$data.pointExists($p) {
                                        content 'text/plain', 'not-found'
                                    }
                                    else {
                                        $data.setPoint($p, %json<name>);
                                        content 'text/plain', 'ok'
                                    }
                                }
                                when 'delete' {
                                    if !$data.pointExists($p) {
                                        content 'text/plain', 'not-found'
                                    }
                                    else {
                                        $data.deletePoint($p);
                                        content 'text/plain', 'ok'
                                    }
                                }
                            }
                        }
                    }                
                }
            }
        }

        post -> 'api', $type {
            given $type {
                when 'login' {
                    request-body 'application/json' => -> %json = {} {
                        # keys: usr, time_token, hash
                        if ! %json<time_token>.defined { bad-request }
                        elsif $timeTokens.isValid(%json<time_token>) {
                            if md5(%UP{ %json<usr> } ~ %json<time_token>) eq %json<hash> {
                                content 'text/plain', newLogToken;
                            }
                            else {
                                forbidden
                            }
                        }
                        else {
                            response.status = 408;
                        }
                    };
                }

                default {
                   not-found
                }
            }
        }
    }
}
