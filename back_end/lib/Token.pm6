use Digest::MD5;

unit module Token;

class Tokens is export {
    #token => birthday
    has %!tokens;
    has Int $!timeOut;

    submethod BUILD(:time_out(:$!timeOut)) { }

    method getToken(%data --> Str) {
        %data<token_id> += 1;
        self.makeToken(%data<token_id>);
    }

    method isValid(Str $token) {
        so %!tokens{$token}:exists
            and DateTime.now.posix - %!tokens{$token} <= $!timeOut;
    }

    submethod makeToken(Int $id) {
        my $newToken = Digest::MD5.new.md5_hex($id.Str);
        %!tokens{$newToken} = DateTime.now.posix;
        $newToken
    }
}
