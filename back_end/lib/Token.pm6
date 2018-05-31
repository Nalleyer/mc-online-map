unit module Token;
use Digest::MD5;

class Tokens is export {
    #token => birthday
    has %!tokens;
    has Int $!timeOut;

    submethod BUILD(:time_out(:$!timeOut)) { }

    method getToken(Int $id --> Str) {
        self.makeToken($id);
    }

    method isValid(Str $token) {
        so %!tokens{$token}:exists
            and DateTime.now.posix - %!tokens{$token} <= $!timeOut;
    }

    method deleteOldToken {
        for %!tokens.kv -> $k, $v {
            next if self.isValid($k);
            %!tokens{$k}:delete
        }
    }

    method refresh(Str $token) {
        %!tokens{$token} = DateTime.now.posix if %!tokens{$token}:exists;
    }

    method gist {
        %!tokens.gist
    }

    submethod makeToken(Int $id) {
        my $newToken = Digest::MD5.new.md5_hex($id.Str);
        %!tokens{$newToken} = DateTime.now.posix;
        $newToken
    }
}
