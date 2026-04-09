import dns.resolver
import sys

def debug_dns(domain):
    print(f"Debugging DNS for: {domain}")
    srv_query = f"_mongodb._tcp.{domain}"
    
    resolvers = ['8.8.8.8', '1.1.1.1', '192.168.0.1']
    
    for r_ip in resolvers:
        print(f"\nTrying resolver: {r_ip}")
        resolver = dns.resolver.Resolver()
        resolver.nameservers = [r_ip]
        try:
            print(f"  Querying SRV {srv_query}...")
            answers = resolver.resolve(srv_query, 'SRV')
            for rdata in answers:
                print(f"    SRV record: {rdata.target}:{rdata.port}")
            
            print(f"  Querying TXT {domain}...")
            answers = resolver.resolve(domain, 'TXT')
            for rdata in answers:
                print(f"    TXT record: {rdata}")
        except Exception as e:
            print(f"  Error with {r_ip}: {e}")

if __name__ == "__main__":
    debug_dns("delta-labs-docs.8v7mkgs.mongodb.net")
