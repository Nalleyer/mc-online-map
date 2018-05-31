use HTTP::UserAgent;
use IO::Socket::SSL;
use JSON::Fast;
use Digest::MD5;

constant URI = 'http://home.remi.moe:8000/api/login';
constant URI_P = 'http://home.remi.moe:8000/api/points';
constant USR = 'admin';
constant PSW = 'bjsdxb';

sub md5(Str $s) {
    Digest::MD5.new.md5_hex($s)
}

sub post($uri, $a, %form, %header) {
    my $req = HTTP::Request.new(POST => $uri, |%header);
    $req.add-content(to-json %form);
    return $a.request($req);
}

sub put($uri, $a, %form, %header) {
    my $req = HTTP::Request.new(PUT => $uri, |%header);
    $req.add-content(to-json %form);
    return $a.request($req);
}

sub MAIN($x, $y, $name) {

    my $a = HTTP::UserAgent.new;

## login
## 1. get
    my Str $tt = $a.get(URI).content;
    say 'got tt: ' ~ $tt;

## 2. post
    my %h = ('content-type' => 'application/json');
    my %p = ('usr' => USR, 'hash' => md5(PSW ~ $tt), 'time_token' => $tt);
    my $req = post(URI, $a, %p, %h);

    die $req.status-line unless $req.is-success;
    my $token = $req.content;
    say 'logged in, token: ' ~ $token;

## add point

    my %p2 = (
        'token' => $token,
        'point' => "($x,$y)",
        'name' => $name,
        'method' => 'add',
    );
    my $req2 = put(URI_P, $a, %p2, %h);
    die $req2.status-line unless $req2.is-success;
    say 'try add point, got: '  ~ $req2.content;
    say $a.get(URI_P, |{'token' => $token}).content;


## set point
    %p2<method> = 'set';
    %p2<name> = 'setted';
    my $req3 = put(URI_P, $a, %p2, %h);
    die $req3.status-line unless $req3.is-success;
    say 'setted, got: '  ~ $req3.content;
    say $a.get(URI_P, |{'token' => $token}).content;
## delete point
#    %p2<method> = 'delete';
#    %p2<name>:delete;
#    my $req4 = put(URI_P, $a, %p2, %h);
#    die $req4.status-line unless $req4.is-success;
#    say 'deleted , got: '  ~ $req4.content;
#    say $a.get(URI_P, |{'token' => $token}).content;

}
